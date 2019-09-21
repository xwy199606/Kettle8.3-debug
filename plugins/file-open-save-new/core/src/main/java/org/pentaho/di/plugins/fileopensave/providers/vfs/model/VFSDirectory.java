/*! ******************************************************************************
 *
 * Pentaho Data Integration
 *
 * Copyright (C) 2019 by Hitachi Vantara : http://www.pentaho.com
 *
 *******************************************************************************
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

package org.pentaho.di.plugins.fileopensave.providers.vfs.model;

import org.apache.commons.vfs2.FileObject;
import org.apache.commons.vfs2.FileSystemException;
import org.pentaho.di.plugins.fileopensave.api.providers.Directory;
import org.pentaho.di.plugins.fileopensave.providers.vfs.VFSFileProvider;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Created by bmorrise on 2/13/19.
 */
public class VFSDirectory extends VFSFile implements Directory {
  private boolean hasChildren;
  private boolean canAddChildren;
  private List<VFSFile> children = new ArrayList<>();

  public static String DIRECTORY = "folder";

  @Override public String getType() {
    return DIRECTORY;
  }

  public boolean hasChildren() {
    return hasChildren;
  }

  public void setHasChildren( boolean hasChildren ) {
    this.hasChildren = hasChildren;
  }

  public List<VFSFile> getChildren() {
    return children;
  }

  public void setChildren( List<VFSFile> children ) {
    this.children = children;
  }

  public void addChild( VFSFile file ) {
    this.children.add( file );
  }

  public boolean isHasChildren() {
    return hasChildren;
  }

  @Override public boolean isCanAddChildren() {
    return canAddChildren;
  }

  public void setCanAddChildren( boolean canAddChildren ) {
    this.canAddChildren = canAddChildren;
  }

  public static VFSDirectory create( String parent, FileObject fileObject, String connection ) {
    VFSDirectory vfsDirectory = new VFSDirectory();
    vfsDirectory.setName( fileObject.getName().getBaseName() );
    vfsDirectory.setPath( fileObject.getName().getFriendlyURI() );
    vfsDirectory.setParent( parent );
    vfsDirectory.setConnection( connection );
    vfsDirectory.setRoot( VFSFileProvider.NAME );
    vfsDirectory.setCanEdit( true );
    vfsDirectory.setHasChildren( true );
    vfsDirectory.setCanAddChildren( true );
    try {
      vfsDirectory.setDate( new Date( fileObject.getContent().getLastModifiedTime() ) );
    } catch ( FileSystemException e ) {
      vfsDirectory.setDate( new Date() );
    }
    return vfsDirectory;
  }
}
