package io.oz.album.tier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;

import java.io.File;
import java.sql.SQLException;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;
import org.vishag.async.AsyncSupplier;

import io.odysz.jclient.Clients;
import io.odysz.jclient.InsecureClient;
import io.odysz.jclient.tier.ErrorCtx;
import io.odysz.semantic.jprotocol.AnsonMsg.MsgCode;
import io.odysz.semantic.jprotocol.AnsonResp;
import io.odysz.semantics.IUser;
import io.odysz.semantics.x.SemanticException;
import io.odysz.transact.x.TransException;
import io.oz.album.AlbumTier;

/**
 * <pre>INSERT INTO h_photos (pid,uri,pname,pdate,cdate,tags,oper,opertime) VALUES
	 ('test-00000','omni/ody/2019_08/DSC_0005.JPG','DSC_0005.JPG','2019-08-24','2021-08-24','#Qing Hai Lake','ody','2022-01-13'),
	 ('test-00001','omni/ody/2019_08/DSC_0124.JPG','DSC_0124.JPG','2019-08-24','2021-08-24','#Qing Hai Lake','ody','2022-01-13'),
	 ('test-00002','omni/ody/2021_08/IMG_20210826.jgp','IMG_20210826.jgp','2019-08-24 15:44:30','2021-08-26','#Lotus Lake','ody','2022-01-13'),
	 ('test-00003','omni/ody/2021_10/IMG_20211005.jgp','IMG_20211005.jgp','2019-10-05 11:19:18','2021-10-05','#Song Gong Fort','ody','2022-01-13'),
	 ('test-00004','omni/ody/2021_12/DSG_0753.JPG','DSG_0753.JPG','2021-12-05','2021-12-05','#Garze','ody','2022-01-13'),
	 ('test-00005','omni/ody/2021_12/DSG_0827.JPG','DSG_0827.JPG','2021-12-05','2021-12-05','#Garze','ody','2022-01-13'),
	 ('test-00006','omni/ody/2021_12/DSG_0880.JPG','DSG_0880.JPG','2021-12-31','2021-12-31','#Toronto','ody','2022-01-13');
   </pre>
 * @author ody
 *
 */
class AlbumsTest {
	static String jserv;

	static IUser robot;
	/** local working dir */
	static String local;
	
	static InsecureClient client;

	static ErrorCtx errCtx;

	static {
		try {
			jserv = "http://localhost:8080/jserv-album";
			Clients.init(jserv);

			client = new InsecureClient(jserv);
			local = new File("src/test/local").getAbsolutePath();
			
			errCtx = new ErrorCtx() {
				public void onError(MsgCode c, AnsonResp rep) {
					fail(rep.msg()); 
				}
			};
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

//	@SuppressWarnings("unchecked")
//	@Test
//	void testUpload() throws SemanticException, TransException, SQLException {
//		AlbumReq req = new AlbumReq("/local/test");
//		req.a(A.insert);
//		req.albumId = "a-001";
//		
//		AlbumResp resp = Albums.album(req, robot);
//		Photo photoRec = resp.collects[0][0];
//		
//		String localPath = "my.jpg";
//		Supplier<String>[] resultSuppliers = null;
//		try {
//			resultSuppliers = AsyncSupplier.getDefault().submitSuppliers(
//						() -> new StreamClient<Photo>().upload(photoRec, localPath) );
//		}
//		catch (Exception ex) {
//			fail(ex.getMessage());
//		}
//	}

	@SuppressWarnings("unchecked")
	@Test
	void testDownload() throws SemanticException, TransException, SQLException {
		Supplier<AlbumResp> albumResp = null;
		try {
			albumResp = AsyncSupplier
					.getDefault()
					.submitSupplier(
						() -> getCollection("c-001")
					);
		}
		catch (Exception ex) {
			fail(ex.getMessage());
		}

		AlbumResp resp = albumResp.get();
		Photo[] collect = resp.photos.get(0);
		Photo ph1 = collect[0];
		Photo ph2 = collect[1];
		Photo ph3 = collect[2];
	
		Supplier<String>[] resultSuppliers = null;
		try {
			resultSuppliers = AsyncSupplier.getDefault().submitSuppliers(
				     () -> getDownloadResult(ph1, ph1.pname),
				     () -> getDownloadResult(ph2, ph2.pname),
				     () -> getDownloadResult(ph3, ph3.pname)
				   );
		}
		catch (Exception ex) {
			fail(ex.getMessage());
		}

		String a = resultSuppliers[0].get();
		String b = resultSuppliers[1].get();
		String c = resultSuppliers[2].get();
	}

	AlbumResp getCollection(String collectId) {
		AlbumResp[] buf = new AlbumResp[1];
		String signal = "";
		AlbumTier tier = new AlbumTier(client, errCtx);
		try {
			/*
			AnsonMsg<? extends AnsonBody> q = client.userReq(AlbumPort.album, null, req);
			client.commit(q, (MsgCode msgCode, AnsonResp resp) -> {
				buf[0] = (AlbumResp) resp;
			} );
			*/
			tier.getCollect(collectId, (MsgCode msgCode, AnsonResp resp) -> {
				buf[0] = (AlbumResp) resp;
				signal.notify();
			});
		} catch (Exception e) {
			e.printStackTrace();
		}

		try {
			signal.wait(10000);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}

		return buf[0];
	}

	String getDownloadResult(Photo photo, String filepath) {
		return new StreamClient<Photo>().download(photo, filepath);
	}
}
