package io.oz.fpick.adapter;

import android.content.Context;
import android.graphics.drawable.AnimationDrawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.vincent.filepicker.ToastUtil;
import com.vincent.filepicker.Util;
import com.vincent.filepicker.filter.entity.AudioFile;
import com.vincent.filepicker.filter.entity.BaseFile;

import java.util.ArrayList;

import io.oz.fpick.R;

/**
 * Created by Ody Zhou
 * Date: 23 Feb. 2022
 *
 * Credits to Vincent Woo
 */
public class AudioPickAdapter extends BaseSynchronizer<AudioFile, AudioPickAdapter.AudioPickViewHolder> {
    public AudioPickAdapter(Context ctx, ArrayList<AudioFile> list, int max) {
        super(ctx, list);
        mMaxNumber = max;
    }

    @NonNull
    @Override
    public AudioPickViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View itemView = LayoutInflater.from(mContext).inflate(R.layout.vw_layout_item_audio_pick, parent, false);
        AudioPickViewHolder holder=new AudioPickViewHolder(itemView);
        holder.setIsRecyclable ( false );
        return holder;
    }

    @Override
    public void onBindViewHolder(@NonNull AudioPickViewHolder holder, int position) {
        final AudioFile file = mList.get(position);

        holder.mTvTitle.setText(file.getName());
        holder.mTvTitle.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED);
        if (holder.mTvTitle.getMeasuredWidth() >
                Util.getScreenWidth(mContext) - Util.dip2px(mContext, 10 + 32 + 10 + 48 + 10 * 2)) {
            holder.mTvTitle.setLines(2);
        } else {
            holder.mTvTitle.setLines(1);
        }

        holder.mTvDuration.setText(Util.getDurationString(file.getDuration()));
        if (file.synchFlag == BaseFile.Synchronizing) {
            holder.mCbx.setSelected ( false );
            holder.icAlbum.setVisibility(View.GONE);
            holder.icSyncing.setVisibility(View.VISIBLE);
            holder.icSynced.setVisibility(View.GONE);
        }
        else if (file.synchFlag == BaseFile.Synchronized) {
            holder.mCbx.setSelected(true);
            holder.icAlbum.setVisibility(View.INVISIBLE);
            holder.icSyncing.setVisibility(View.GONE);
            holder.icSynced.setVisibility(View.VISIBLE);
        }
        else if (file.isSelected()) {
            holder.mCbx.setSelected(true);
            holder.animation.setVisibility ( View.VISIBLE );
            holder.animation.setAlpha ( 1f );
            AnimationDrawable animationDrawable = (AnimationDrawable) holder.animation.getBackground ( );
//            Animation a = AnimationUtils.loadAnimation ( mContext,R.anim.rotate_animation );
            animationDrawable.start ();
        } else {
            holder.mCbx.setSelected(false);
            holder.animation.setVisibility ( View.INVISIBLE );
            holder.animation.setAlpha ( 0f );
        }
        //change itemview to mCbx
        holder.itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!v.isSelected() && isUpToMax()) {
                    ToastUtil.getInstance(mContext).showToast(R.string.vw_up_to_max);
                    return;
                }

                if (v.isSelected()) {
                    holder.mCbx.setSelected(false);
                    mCurrentNumber--;
                } else {
                    holder.mCbx.setSelected(true);
                    mCurrentNumber++;
                }

                mList.get(holder.getAdapterPosition()).setSelected(holder.mCbx.isSelected());

                if (mListener != null) {
                    mListener.onAudioStateChanged (holder.mCbx.isSelected(), mList.get(holder.getAdapterPosition()),holder.animation);
                }
            }
        });
    }

    @Override
    public int getItemCount() {
        return 0;
    }

    class AudioPickViewHolder extends RecyclerView.ViewHolder {
        private final ImageView icAlbum;
        private final ImageView icSynced;
        private final ImageView icSyncing;

        private TextView mTvTitle;
        private TextView mTvDuration;
        private final ImageView mCbx;
        private final RelativeLayout animation;

        private TextView mDuration;
        private RelativeLayout mDurationLayout;

        public AudioPickViewHolder(@NonNull View itemView) {
            super ( itemView );
            icAlbum = (ImageView) itemView.findViewById ( R.id.xiv_album_icon);
            icSyncing = (ImageView) itemView.findViewById ( R.id.xiv_syncing_icon);
            icSynced = (ImageView) itemView.findViewById ( R.id.xiv_synced_icon);

//            mIvThumbnail = (ImageView) itemView.findViewById ( R.id.xiv_thumbnail );
//            mShadow = itemView.findViewById ( R.id.x_shadow );
//            mCbx = (ImageView) itemView.findViewById ( R.id.x_check );
//            animation = itemView.findViewById ( R.id.animationSquarevideo );
//            mDuration = (TextView) itemView.findViewById(R.id.txt_duration);
//            mDurationLayout = (RelativeLayout) itemView.findViewById(R.id.layout_duration);

            mTvTitle = (TextView) itemView.findViewById(R.id.tv_audio_title);
            mTvDuration = (TextView) itemView.findViewById(R.id.tv_duration);
            mCbx = (ImageView) itemView.findViewById(R.id.cbx);
            animation = itemView.findViewById ( R.id.animationAudio );
        }
    }

    public boolean isUpToMax () {
        return mCurrentNumber >= mMaxNumber;
    }

}