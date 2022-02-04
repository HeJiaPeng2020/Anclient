package io.odysz.jclient;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;

import io.odysz.anson.x.AnsonException;
import io.odysz.common.Utils;
import io.odysz.jclient.tier.ErrorCtx;
import io.odysz.semantic.jprotocol.AnsonBody;
import io.odysz.semantic.jprotocol.AnsonHeader;
import io.odysz.semantic.jprotocol.AnsonMsg;
import io.odysz.semantic.jprotocol.AnsonMsg.MsgCode;
import io.odysz.semantic.jprotocol.AnsonMsg.Port;
import io.odysz.semantic.jprotocol.AnsonResp;
import io.odysz.semantic.jprotocol.IPort;
import io.odysz.semantic.jprotocol.LogAct;
import io.odysz.semantic.jprotocol.JProtocol.SCallbackV11;
import io.odysz.semantic.jserv.R.AnQueryReq;
import io.odysz.semantic.jserv.U.AnInsertReq;
import io.odysz.semantic.jserv.U.AnUpdateReq;
import io.odysz.semantic.jsession.SessionInf;
import io.odysz.semantics.x.SemanticException;

/**TODO rename as SessionClient
 * @author odys-z@github.com
 *
 */
public class SessionClient {
	static boolean verbose;
	public static void verbose(boolean v) { verbose = v;}

	private SessionInf ssInf;
	public SessionInf ssInfo () { return ssInf; }
	
	private ArrayList<String[]> urlparas;
	private AnsonHeader header;
	
	/**Session login response from server.
	 * @param sessionInfo
	 */
	SessionClient(SessionInf sessionInfo) {
		this.ssInf = sessionInfo;
	}
	
	/**Format a query request object, including all information for construct a "select" statement.
	 * @param conn connection id
	 * @param tbl main table, (sometimes function category), e.g. "e_areas"
	 * @param alias from table alias, e.g. "a"
	 * @param page -1 for no paging at server side.
	 * @param size
	 * @param funcId current function ID
	 * @return formatted query object.
	 * @throws Exception
	 */
	public AnsonMsg<AnQueryReq> query(String conn, String tbl, String alias,
			int page, int size, String... funcId) throws SemanticException {

		AnsonMsg<AnQueryReq> msg = new AnsonMsg<AnQueryReq>(Port.query);

		AnsonHeader header = new AnsonHeader(ssInf.ssid(), ssInf.uid());
		if (funcId != null && funcId.length > 0)
			// FIXME Bug? No test for DB log since Antson 1.0?
			// FIXME Bug? No test for DB log since Antson 1.0?
			// FIXME Bug? No test for DB log since Antson 1.0?
			AnsonHeader.usrAct(funcId[0], "query", "R", "test");
		msg.header(header);

		AnQueryReq itm = AnQueryReq.formatReq(conn, msg, tbl, alias);
		msg.body(itm);
		itm.page(page, size);

		return msg;
	}
	
	@SuppressWarnings("unchecked")
	public AnsonMsg<AnUpdateReq> update(String conn, String tbl, String... act)
			throws SemanticException {

		AnUpdateReq itm = AnUpdateReq.formatUpdateReq(conn, null, tbl);
		AnsonMsg<? extends AnsonBody> jmsg = userReq(Port.update, act, itm);

		AnsonHeader header = new AnsonHeader(ssInf.ssid(), ssInf.uid());
		if (act != null && act.length > 0)
			header.act(act);
		
		return (AnsonMsg<AnUpdateReq>) jmsg.header(header) 
					;//.body(itm);
	}

	/**@deprecated replaced by #usr
	 * create a user type of message.
	 * @param <T> body type
	 * @param port
	 * @param act not used for session less
	 * @param req request body
	 * @return Anson message
	 * @throws SemanticException
	 */
	public <T extends AnsonBody> AnsonMsg<T> userReq(IPort port, String[] act, T req)
			throws SemanticException {
		if (ssInf == null)
			throw new SemanticException("SessionClient can not visit jserv without session information.");

		AnsonMsg<T> jmsg = new AnsonMsg<T>(port);
		
		header().act(act);
		jmsg.header(header);
		jmsg.body(req);

		return jmsg;
	}

	/**
	 * @param <T>
	 * @param uri component uri
	 * @param port
	 * @param bodyItem request body, created by like: new jvue.UserReq(uri, tabl).
	 * @param act action, optional.
	 * @return AnsonMsg 
	 * @throws AnsonException port is null
	 */
	public <T extends AnsonBody> AnsonMsg<T> userReq(String uri, IPort port, T bodyItem, LogAct... act) throws AnsonException {
		if (port == null)
			throw new AnsonException(0, "AnsonMsg<UserReq> needs port explicitly specified.");

		// let header = Protocol.formatHeader(this.ssInf);
		bodyItem.uri(uri);
		if (act != null && act.length > 0)
			header.act(act[0]); 

		return new AnsonMsg<T>(port).header(header).body(bodyItem);
	}

	public AnsonMsg<?> insert(String conn, String tbl, String ... act) throws SemanticException {
		AnInsertReq itm = AnInsertReq.formatInsertReq(conn, null, tbl);
		AnsonMsg<? extends AnsonBody> jmsg = userReq(Port.insert, act, itm);

		AnsonHeader header = new AnsonHeader(ssInf.ssid(), ssInf.uid());
		if (act != null && act.length > 0)
			header.act(act);
		
		return jmsg.header(header) 
					.body(itm);
	}

	public AnsonHeader header() {
		if (header == null)
			header = new AnsonHeader(ssInf.ssid(), ssInf.uid());
		return header;
	}
	
	public SessionClient urlPara(String pname, String pv) {
		if (urlparas == null)
			urlparas = new ArrayList<String[]>();
		urlparas.add(new String[] {pname, pv});
		return this;
	}

	/**Print Json Request (no request sent to server)
	 * @param req 
	 * @return this object
	 * @throws SQLException 
	 */
	public SessionClient console(AnsonMsg<? extends AnsonBody> req) throws SQLException {
		if(Clients.console) {
			try {
				Utils.logi(req.toString());
			} catch (Exception ex) { ex.printStackTrace(); }
		}
		return this;
	}

	/**@deprecated This is asynchronous API but works in synchronous.
	 * @see {@link HttpServClient#post(String, AnsonMsg, SCallbackV11)}
	 * <br>
	 * The {@link ErrorCtx} API pattern is better.
	 * @see #commit(AnsonMsg, SCallbackV11, ErrorCtx)
	 * @param <R> Request type
	 * @param <A> Response type
	 * @param req request
	 * @param onOk on ok callback
	 * @param onErr error context
	 * @throws SemanticException
	 * @throws IOException
	 * @throws SQLException
	 * @throws AnsonException
	 */
	@SuppressWarnings("unchecked")
	public <R extends AnsonBody, A extends AnsonResp> void commit(AnsonMsg<R> req, SCallbackV11 onOk, SCallbackV11... onErr)
			throws SemanticException, IOException, SQLException, AnsonException {
    	HttpServClient httpClient = new HttpServClient();

    	if (verbose) {
    		Utils.logi(Clients.servUrl(req.port()));
    		Utils.logAnson(req);
    	}
  		httpClient.post(Clients.servUrl(req.port()), req,
  				(code, obj) -> {
  					if(Clients.console) {
  						Utils.printCaller(false);
  						Utils.logAnson(obj);
  					}
  					if (MsgCode.ok == code) {
  						onOk.onCallback(code, (A) obj);
  					}
  					else {
  						if (onErr != null && onErr.length > 0 && onErr[0] != null)
  							onErr[0].onCallback(code, obj);
  						else Utils.warn("code: %s\nerror: %s", code, ((AnsonResp)obj).msg());
  					}
  				});
	}

	@SuppressWarnings("unchecked")
	public <R extends AnsonBody, A extends AnsonResp> A commit(AnsonMsg<R> req, ErrorCtx err)
			throws SemanticException, IOException, AnsonException {
    	HttpServClient httpClient = new HttpServClient();
    	if (verbose) {
    		Utils.logi(Clients.servUrl(req.port()));
    		Utils.logAnson(req);
    	}
  		AnsonMsg<AnsonResp> resp = httpClient.post(Clients.servUrl(req.port()), req);

  		MsgCode code = resp.code();

		if(Clients.console) {
		  Utils.printCaller(false);
		  Utils.logAnson(resp);
		}

		if (MsgCode.ok == code) {
			return (A) resp.body(0);
		}
		else {
			err.onError(code, resp.body(0));
			return null;
		}
	}

	public void logout() { }

}