package io.oz.albumtier;

import java.io.IOException;

import io.odysz.anson.x.AnsonException;
import io.odysz.jclient.SessionClient;
import io.odysz.jclient.tier.ErrorCtx;
import io.odysz.jclient.tier.Semantier;
import io.odysz.semantic.jprotocol.AnsonHeader;
import io.odysz.semantic.jprotocol.AnsonMsg;
import io.odysz.semantic.jprotocol.AnsonMsg.MsgCode;
import io.odysz.semantic.jprotocol.AnsonResp;
import io.odysz.semantic.jprotocol.JProtocol.OnError;
import io.odysz.semantic.jprotocol.JProtocol.OnOk;
import io.odysz.semantics.x.SemanticException;
import io.oz.album.AlbumPort;
import io.oz.album.tier.AlbumReq;
import io.oz.album.tier.AlbumReq.A;
import io.oz.album.tier.AlbumResp;
import io.oz.jserv.sync.Synclientier;

import static io.odysz.common.LangExt.isblank;

/**
 * @author odys-z@github.com
 *
 */
public class PhotoSyntier extends Semantier {
	public static int blocksize = 3 * 1024 * 1024;

	protected String clientUri;
	protected String device;

	protected ErrorCtx errCtx;

	protected Synclientier synctier;

	private SessionClient client;

	static {
		AnsonMsg.understandPorts(AlbumPort.album);
	}

	/**
	 * @param clientUri - the client function uri this instance will be used for.
	 * @param device
	 * @param client 
	 * @param errCtx
	 */
	public PhotoSyntier(String uri, SessionClient client, String device, ErrorCtx errCtx) {
		this.clientUri = uri;
		this.client = client;
		this.device = device;
		this.errCtx = errCtx;

		// String nodeId = Configs.getCfg("");
		// this.synctier = new Synclientier(clientUri, null, nodeId, errCtx);

//		this.worker = new SyncWorker(SyncMode.main, nodeId, conn, Kyiv.JNode.worker, meta)
//				.login(Kyiv.JNode.passwd);
	}

	public AlbumResp getCollect(String collectId) throws SemanticException, IOException, AnsonException {
		AlbumReq req = new AlbumReq(clientUri).collectId("c-001");
		req.a(A.collect);
		AnsonMsg<AlbumReq> q = client.<AlbumReq>userReq(clientUri, AlbumPort.album, req);
		return client.commit(q, errCtx);
	}
	
	public PhotoSyntier getSettings(OnOk onOk, OnError... onErr) {
		new Thread(new Runnable() {
			public void run() {
			try {
				AnsonHeader header = client.header()
						.act("album.java", "profile", "r/settings", "load profile");

				AlbumReq req = new AlbumReq(clientUri);
				req.a(A.getPrefs);
				AnsonMsg<AlbumReq> q = client.<AlbumReq>userReq(clientUri, AlbumPort.album, req)
						.header(header);
				AnsonResp resp = client.commit(q, errCtx);
				onOk.ok(resp);
			} catch (IOException e) {
				if (isblank(onErr))
					errCtx.err(MsgCode.exIo, "%s\n%s", e.getClass().getName(), e.getMessage());
				else onErr[0].err(MsgCode.exIo, "%s\n%s", e.getClass().getName(), e.getMessage());
			} catch (AnsonException | SemanticException e) { 
				if (isblank(onErr))
					errCtx.err(MsgCode.exGeneral, "%s\n%s", e.getClass().getName(), e.getMessage());
				else onErr[0].err(MsgCode.exGeneral, "%s\n%s", e.getClass().getName(), e.getMessage());
			} 
		} } ).start();
		
		return this;
	}
	
//	/**
//	 * 
//	 * @param videos
//	 * @param user
//	 * @param proc
//	 * @param onErr
//	 * @return
//	 */
//	public List<DocsResp> syncVideos(List<? extends IFileDescriptor> videos,
//				SessionInf user, OnProcess proc, ErrorCtx ... onErr) {
//
//		ErrorCtx errHandler = onErr == null || onErr.length == 0 ? errCtx : onErr[0];
//
//        DocsResp resp = null;
//		try {
//			String[] act = AnsonHeader.usrAct("album.java", "synch", "c/photo", "multi synch");
//			AnsonHeader header = client.header().act(act);
//
//			List<DocsResp> reslts = new ArrayList<DocsResp>(videos.size());
//
//			for ( int px = 0; px < videos.size(); px++ ) {
//
//				IFileDescriptor p = videos.get(px);
//				DocsReq req = new DocsReq()
//						.blockStart(p, user);
//
//				AnsonMsg<DocsReq> q = client.<DocsReq>userReq(clientUri, AlbumPort.album, req)
//										.header(header);
//
//				resp = client.commit(q, errHandler);
//
//				String pth = p.fullpath();
//				if (!pth.equals(resp.doc.fullpath()))
//					Utils.warn("Resp is not replied with exactly the same path: %s", resp.doc.fullpath());
//
//				int totalBlocks = (int) ((Files.size(Paths.get(pth)) + 1) / blocksize);
//				if (proc != null) proc.proc(videos.size(), px, 0, totalBlocks, resp);
//
//				int seq = 0;
//				FileInputStream ifs = new FileInputStream(new File(p.fullpath()));
//				try {
//					String b64 = AESHelper.encode64(ifs, blocksize);
//					while (b64 != null) {
//						req = new DocsReq().blockUp(seq, p, b64, user);
//						seq++;
//
//						q = client.<DocsReq>userReq(clientUri, AlbumPort.album, req)
//									.header(header);
//
//						resp = client.commit(q, errHandler);
//						if (proc != null) proc.proc(videos.size(), px, seq, totalBlocks, resp);
//
//						b64 = AESHelper.encode64(ifs, blocksize);
//					}
//					req = new DocsReq().blockEnd(resp, user);
//
//					q = client.<DocsReq>userReq(clientUri, AlbumPort.album, req)
//								.header(header);
//					resp = client.commit(q, errHandler);
//					if (proc != null) proc.proc(videos.size(), px, seq, totalBlocks, resp);
//				}
//				catch (Exception ex) {
//					Utils.warn(ex.getMessage());
//
//					req = new DocsReq().blockAbort(resp, user);
//					req.a(DocsReq.A.blockAbort);
//					q = client.<DocsReq>userReq(clientUri, AlbumPort.album, req)
//								.header(header);
//					resp = client.commit(q, errHandler);
//					if (proc != null) proc.proc(videos.size(), px, seq, totalBlocks, resp);
//
//					throw ex;
//				}
//				finally { ifs.close(); }
//
//				reslts.add(resp);
//			}
//
//			return reslts;
//		} catch (IOException e) {
//			errHandler.onError(MsgCode.exIo, e.getClass().getName() + " " + e.getMessage());
//		} catch (AnsonException | SemanticException e) { 
//			errHandler.onError(MsgCode.exGeneral, e.getClass().getName() + " " + e.getMessage());
//		}
//		return null;
//	}
//
//	public String download(Photo photo, String localpath)
//			throws SemanticException, AnsonException, IOException {
//		AlbumReq req = new AlbumReq(clientUri).download(photo);
//		req.a(A.download);
//		return client.download(clientUri, AlbumPort.album, req, localpath);
//	}
//
//	public AlbumResp insertPhoto(String collId, String fullpath, String clientname)
//			throws SemanticException, IOException, AnsonException {
//
//		AlbumReq req = new AlbumReq(clientUri)
//				.createPhoto(collId, fullpath)
//				.photoName(clientname);
//
//		String[] act = AnsonHeader.usrAct("album.java", "create", "c/photo", "create photo");
//		AnsonHeader header = client.header().act(act);
//		AnsonMsg<AlbumReq> q = client.<AlbumReq>userReq(clientUri, AlbumPort.album, req)
//									.header(header);
//
//		return client.commit(q, errCtx);
//	}
//	
//	/**Asynchronously query synchronizing records.
//	 * @param files
//	 * @param page
//	 * @param onOk
//	 * @param onErr
//	 * @return this
//	 */
//	public AlbumSyntier asyncQuerySyncs(List<? extends IFileDescriptor> files, SyncingPage page, OnOk onOk, OnError onErr) {
//		new Thread(new Runnable() {
//	        public void run() {
//	        DocsResp resp = null;
//			try {
//				String[] act = AnsonHeader.usrAct("album.java", "query", "r/states", "query sync");
//				AnsonHeader header = client.header().act(act);
//
//				List<DocsResp> reslts = new ArrayList<DocsResp>(files.size());
//
//				AlbumReq req = (AlbumReq) new AlbumReq().syncing(page).a(A.selectSyncs);
//
//				for (int i = page.start; i < page.end & i < files.size(); i++) {
//					IFileDescriptor p = files.get(i);
//					// req.querySync(p);
//				}
//
//				AnsonMsg<AlbumReq> q = client.<AlbumReq>userReq(clientUri, AlbumPort.album, req)
//										.header(header);
//
//				resp = client.commit(q, new ErrorCtx() {
//					@Override
//					public void onError(MsgCode code, String msg) {
//						onErr.err(code, msg);
//					}
//				});
//
//				reslts.add(resp);
//				onOk.ok(resp);
//			} catch (IOException e) {
//				onErr.err(MsgCode.exIo, clientUri, e.getClass().getName(), e.getMessage());
//			} catch (AnsonException | SemanticException e) { 
//				onErr.err(MsgCode.exGeneral, clientUri, e.getClass().getName(), e.getMessage());
//			}
//	    } } ).start();
//		return null;
//	}
//
//	/**
//	 * push photos
//	 * 
//	 * <b>Issue:</b>
//	 * Can this been replaced by SyncWorker.push() ?
//	 * 
//	 * @param photos
//	 * @param user
//	 * @return synchronizing result
//	 * @throws SemanticException
//	 * @throws IOException
//	 * @throws AnsonException
//	 */
//	public List<AlbumResp> syncPhotos(List<? extends IFileDescriptor> photos, SessionInf user)
//			throws SemanticException, IOException, AnsonException {
//		String[] act = AnsonHeader.usrAct("album.java", "synch", "c/photo", "multi synch");
//		AnsonHeader header = client.header().act(act);
//
//		List<AlbumResp> reslts = new ArrayList<AlbumResp>(photos.size());
//
//		for (IFileDescriptor p : photos) {
//			AlbumReq req = new AlbumReq()
//					.device(user.device)
//					.createPhoto(p, user);
//
//			AnsonMsg<AlbumReq> q = client.<AlbumReq>userReq(clientUri, AlbumPort.album, req)
//									.header(header);
//
//			AlbumResp resp = client.commit(q, errCtx);
//
//			reslts.add(resp);
//		}
//		return reslts;
//	}
//	
//	/**Asynchronously synchronize photos
//	 * @param photos
//	 * @param user
//	 * @param onOk
//	 * @param onErr
//	 * @throws SemanticException
//	 * @throws IOException
//	 * @throws AnsonException
//	 */
//	public void asyncPhotos(List<? extends IFileDescriptor> photos, SessionInf user, OnOk onOk, OnError onErr)
//			throws SemanticException, IOException, AnsonException {
//		new Thread(new Runnable() {
//	        public void run() {
//	        DocsResp resp = null;
//			try {
//				String[] act = AnsonHeader.usrAct("album.java", "synch", "c/photo", "multi synch");
//				AnsonHeader header = client.header().act(act);
//
//				List<DocsResp> reslts = new ArrayList<DocsResp>(photos.size());
//
//				for (IFileDescriptor p : photos) {
//					AlbumReq req = new AlbumReq()
//							.createPhoto(p, user);
//					// req.a(A.insertPhoto);
//
//					AnsonMsg<AlbumReq> q = client.<AlbumReq>userReq(clientUri, AlbumPort.album, req)
//											.header(header);
//
//					resp = client.commit(q, new ErrorCtx() {
//						// @Override public void onError(MsgCode code, AnsonResp obj) { onErr.err(code, obj.msg()); }
//
//						@Override
//						public void onError(MsgCode code, String msg) {
//							onErr.err(code, msg);
//						}
//					});
//
//					reslts.add(resp);
//					onOk.ok(resp);
//				}
//			} catch (IOException e) {
//				onErr.err(MsgCode.exIo, clientUri, e.getClass().getName(), e.getMessage());
//			} catch (AnsonException | SemanticException e) { 
//				onErr.err(MsgCode.exGeneral, clientUri, e.getClass().getName(), e.getMessage());
//			}
//	    } } ).start();
//	}
//
//	/**Get a photo record (this synchronous file base64 content)
//	 * @param docId
//	 * @param onErr
//	 * @return response
//	 */
//	public AlbumResp selectPhotoRec(String docId, ErrorCtx ... onErr) {
//		ErrorCtx errHandler = onErr == null || onErr.length == 0 ? errCtx : onErr[0];
//		String[] act = AnsonHeader.usrAct("album.java", "synch", "c/photo", "multi synch");
//		AnsonHeader header = client.header().act(act);
//
//		AlbumReq req = new AlbumReq().selectPhoto(docId);
//		// req.a(A.rec);
//
//		AlbumResp resp = null;
//		try {
//			AnsonMsg<AlbumReq> q = client.<AlbumReq>userReq(clientUri, AlbumPort.album, req)
//										.header(header);
//
//			resp = client.commit(q, errCtx);
//		} catch (AnsonException | SemanticException e) {
//			errHandler.onError(MsgCode.exSemantic, e.getMessage() + " " + (e.getCause() == null ? "" : e.getCause().getMessage()));
//		} catch (IOException e) {
//			errHandler.onError(MsgCode.exIo, e.getMessage() + " " + (e.getCause() == null ? "" : e.getCause().getMessage()));
//		}
//		return resp;
//	}
//
//	public AlbumSyntier blockSize(int size) {
//		blocksize = size;
//		return this;
//	}
//
//	/**
//	 * @deprecated replaced by {@link Synclientier#del(String, String)}
//	 * @param device
//	 * @param clientpath
//	 * @return
//	 */
//	public DocsResp del(String device, String clientpath) {
//		AlbumReq req = new AlbumReq().del(device, clientpath);
//
//		DocsResp resp = null;
//		try {
//			String[] act = AnsonHeader.usrAct("album.java", "del", "d/photo", "");
//			AnsonHeader header = client.header().act(act);
//			AnsonMsg<AlbumReq> q = client.<AlbumReq>userReq(clientUri, AlbumPort.album, req)
//										.header(header);
//
//			resp = client.commit(q, errCtx);
//		} catch (AnsonException | SemanticException e) {
//			errCtx.onError(MsgCode.exSemantic, e.getMessage() + " " + (e.getCause() == null ? "" : e.getCause().getMessage()));
//		} catch (IOException e) {
//			errCtx.onError(MsgCode.exIo, e.getMessage() + " " + (e.getCause() == null ? "" : e.getCause().getMessage()));
//		}
//		return resp;
//	}
}