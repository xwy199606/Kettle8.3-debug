/*!
 * Copyright 2019 Hitachi Vantara. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The File Open and Save Folder component.
 *
 * This provides the component for the Folders in the directory tree.
 * @module components/folder/folder.component
 * @property {String} name The name of the Angular component.
 * @property {Object} options The JSON object containing the configurations for this component.

 **/
define([
  "../../services/clipboard.service",
  "text!./folder.html",
  "../utils",
  "css!./folder.css"
], function (clipboardService, folderTemplate, utils) {
  "use strict";

  var options = {
    bindings: {
      tree: "<",
      onSelect: "&",
      onOpen: "&",
      onMove: "&",
      onCopy: "&",
      onDelete: "&",
      showRecents: "<",
      selectedFolder: "<",
      autoExpand: "<"
    },
    template: folderTemplate,
    controllerAs: "vm",
    controller: folderController
  };

  folderController.$inject = [clipboardService.name, "$timeout", "$state"];

  /**
   * The Folder Controller.
   *
   * This provides the controller for the folder component.
   * @param {Function} $timeout - Angular wrapper for window.setTimeout.
   */
  function folderController(clipboardService, $timeout, $state) {
    var vm = this;
    vm.$onChanges = onChanges;
    vm.openFolder = openFolder;
    vm.selectFolder = selectFolder;
    vm.selectAndOpenFolder = selectAndOpenFolder;
    vm.compareFolders = compareFolders;
    vm.getTree = getTree;
    vm.onDrop = onDrop;
    vm.onPaste = onPaste;
    vm.canPaste = canPaste;
    vm.onRightClick = onRightClick;
    vm.onDeleteFolder = onDeleteFolder;
    vm.width = 0;
    vm.state = $state;
    vm.getId = getId;
    vm.targetFolder = null;

    /**
     * Called whenever one-way bindings are updated.
     *
     * @param {Object} changes - hash whose keys are the names of the bound properties
     * that have changed, and the values are an object of the form
     */
    function onChanges(changes) {
      if (changes.selectedFolder) {
        _setWidth();
      }
    }

    function getTree() {
      if (vm.tree) {
        return vm.tree;
      }
      return [];
    }

    function getId(folder) {
      return folder.provider + ":" + folder.connection + ":" + folder.path;
    }

    /**
     * Opens the folder to display and children folders in directory tree.
     * Also, sets maxDepth variable of open folders.
     *
     * @param {Object} folder - folder object
     */
    function openFolder(folder, callback) {
      folder.open = !folder.open;
      vm.onOpen({openFolder: folder}).then(function () {
        _setWidth();
      });
    }

    function _setFolder(folder) {
      vm.width = 0;
      folder.open = folder.open !== true;
      if (folder.open === false) {
        folder.loading = false;
      }
    }

    /**
     * Selects folder
     *
     * @param {Object} folder - folder object
     */
    function selectFolder(folder) {
      vm.onSelect({selectedFolder: folder});
    }

    /**
     * Call functions above to select and open folder
     *
     * @param {Object} folder - folder object
     */
    function selectAndOpenFolder(folder) {
      selectFolder(folder);
      openFolder(folder);
    }

    /**
     * Selects a folder by path
     * @param {String} path - Path to folder
     * @private
     */
    function _openFolderTree(path) {
      vm.tree.children[0].name = "/";
      path = path === "/" ? "" : path;
      var parts = path.split("/");
      parts[0] = "/";
      var index = 0;
      _findAndOpenFolder(vm.tree.children, index, parts, function () {
        // If the folder contents have loaded before the tree we want to use that object's children
        if (vm.selectedFolder && vm.selectedFolder.path === path) {
          var folder = _findFolderByPath(path);
          folder.children = vm.selectedFolder.children;
          selectFolder(folder);
        } else {
          _selectFolderByPath(path);
        }
      });
    }

    function _findAndOpenFolder(children, index, parts, callback) {
      if (parts.length === 1) {
        if (callback) {
          callback();
        }
        return;
      }
      if (children[index].name === parts[0]) {
        if (parts.length >= 1) {
          parts.shift();
          openFolder(children[index], function () {
            _findAndOpenFolder(children[index].children, 0, parts, callback);
          });
        }
      } else {
        _findAndOpenFolder(children, ++index, parts, callback);
      }
    }

    /**
     * Selects a folder by path
     * @param {String} path - Path to folder
     * @private
     */
    function _selectFolderByPath(path) {
      selectFolder(_findFolderByPath(path));
    }

    function _findFolderByPath(path) {
      vm.tree.children[0].name = "/";
      path = path === "/" ? "" : path;
      var parts = path.split("/");
      parts[0] = "/";
      return _findFolder(vm.tree.children, parts);
    }

    function _findFolder(children, parts) {
      for (var i = 0; i < children.length; i++) {
        if (children[i].name === parts[0]) {
          if (parts.length > 1) {
            parts.shift();
            return _findFolder(children[i].children, parts);
          } else {
            return children[i];
          }
        }
      }
    }

    /**
     * Compare folders according to sortField
     * @param {Object} first - Folder Object
     * @param {Object} second - Folder Object
     * @return {Number} -1 or 1 according to comparisons of first and second names
     **/
    function compareFolders(first, second) {
      var folder1 = first.value;
      var folder2 = second.value;
      if (!folder1.path || !folder2.path) {
        return 0;
      }
      var path1 = folder1.path.split("/");
      var path2 = folder2.path.split("/");
      var comp = 0;
      var len = Math.min(path1.length, path2.length);
      for (var i = 0; i < len; i++) {
        comp = utils.naturalCompare(path1[i], path2[i]);
        if (comp !== 0) {
          return comp;
        }
      }
      if (path1.length !== path2.length) {
        return path1.length - path2.length;
      }
      return first.index - second.index;
    }

    /**
     * Sets vm.width for scrolling purposes.
     * @private
     */
    function _setWidth() {
      vm.width = 0;
      $timeout(function () {
        vm.width = document.getElementById("directoryTreeArea").scrollWidth;
      }, 0);
    }

    function onDrop(from, to) {
      vm.onMove({
        from: from,
        to: to
      });
    }

    function onPaste() {
      if (clipboardService.operation === "copy") {
        vm.onCopy({
          from: clipboardService.get(),
          to: vm.targetFolder
        });
      }
      if (clipboardService.operation === "cut") {
        vm.onMove({
          from: clipboardService.get(),
          to: vm.targetFolder
        });
      }
      clipboardService.set(null, null);
    }

    function canPaste() {
      return clipboardService.get();
    }

    function onRightClick(folder) {
      vm.targetFolder = folder;
    }

    function onDeleteFolder() {
      vm.onDelete({folder: vm.targetFolder});
    }
  }

  return {
    name: "folder",
    options: options
  };
});
