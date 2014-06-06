package DBinterface;
import java.io.OutputStream;

/**
 * @author Mohamed Mansour
 */
public class StringOutputStream extends OutputStream {

	// This buffer will contain the stream
	protected StringBuffer buf = new StringBuffer();

	public StringOutputStream() {}

	public void close() {}

	public void flush() {

		// Clear the buffer
		buf.delete(0, buf.length());
	}

	public void write(byte[] b) {
		String str = new String(b);
		this.buf.append(str);
	}
	
	public void write(byte[] b, int off, int len) {
		String str = new String(b, off, len);
		this.buf.append(str);
	}

	public void write(int b) {
		String str = Integer.toString(b);
		this.buf.append(str);
	}

	public String toString() {
		return buf.toString();
	}
}
