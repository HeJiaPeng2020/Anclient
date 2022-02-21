package com.vincent.filepicker.filter.entity;

import android.os.Parcel;
import android.os.Parcelable;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;

import io.odysz.common.DateFormat;
import io.odysz.semantic.tier.docs.IFileDescriptor;
import io.oz.album.tier.Photo;

/**
 * Modyfied by Ody Zhou
 *
 * Created by Vincent Woo
 * Date: 2016/10/10
 * Time: 17:32
 */

public class BaseFile implements Parcelable, IFileDescriptor {
    public static int Synchronized = 1;
    public static int SynchUnknown = 0;
    public static int Synchronizing = -1;

    private long id;
    private String name;
    private String path;
    private long size;          //byte
    private String bucketId;    //Directory ID
    private String bucketName;  //Directory Name
    private long date;          //Added Date
    private boolean isSelected;

    public int synchFlag = SynchUnknown;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BaseFile)) return false;

        BaseFile file = (BaseFile) o;
        return this.path.equals(file.path);
    }

    @Override
    public int hashCode() {
        return path.hashCode();
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public String getBucketId() {
        return bucketId;
    }

    public void setBucketId(String bucketId) {
        this.bucketId = bucketId;
    }

    public String getBucketName() {
        return bucketName;
    }

    public void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }

    public long getDate() {
        return date;
    }

    public void setDate(long date) {
        this.date = date;
    }

    public boolean isSelected() {
        return isSelected;
    }

    public void setSelected(boolean selected) {
        isSelected = selected;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeLong(id);
        dest.writeString(name);
        dest.writeString(path);
        dest.writeLong(size);
        dest.writeString(bucketId);
        dest.writeString(bucketName);
        dest.writeLong(date);
        dest.writeByte((byte) (isSelected ? 1 : 0));
    }

    @Override
    public int describeContents() { return 0; }

    public static final Creator<BaseFile> CREATOR = new Creator<BaseFile>() {
        @Override
        public BaseFile[] newArray(int size) {
            return new BaseFile[size];
        }

        @Override
        public BaseFile createFromParcel(Parcel in) {
            BaseFile file = new BaseFile();
            file.id = in.readLong();
            file.name = in.readString();
            file.path = in.readString();
            file.size = in.readLong();
            file.bucketId = in.readString();
            file.bucketName = in.readString();
            file.date = in.readLong();
            file.isSelected = in.readByte() != 0;
            return file;
        }
    };

    String recId;
    @Override
    public String recId() {
        return recId;
    }

    @Override
    public IFileDescriptor recId(String rid) {
        this.recId = rid;
        return this;
    }

    @Override
    public String fullpath() {
        return path;
    }

    @Override
    public IFileDescriptor fullpath(String clientpath) throws IOException {
        path = clientpath;
        return this;
    }

    @Override
    public String clientname() {
        Path p = Paths.get(path);
        return p.getFileName().toString();
    }

    @Override
    public String cdate() {
        return DateFormat.format(new Date(date));
    }

//    public BaseFile synchFlag(int syncFlag) {
//        this.synchFlag = syncFlag;
//        return this;
//    }
}
