package rest;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;


import org.apache.commons.codec.binary.Base64;

public class Utils {
	public static String encrypt(String str,String secret) {
//System.err.println("I want to encrypt "+str);
		  try {
			  SecretKeySpec key = new SecretKeySpec(secret.getBytes(),"DES");
			  String keystring = new String(key.getEncoded());
			    Cipher ecipher;
				ecipher = Cipher.getInstance("DES");
			    ecipher.init(Cipher.ENCRYPT_MODE, key);
		  	// encode the string into a sequence of bytes using the named charset
			  	// storing the result into a new byte array. 
			  	byte[] utf8 = str.getBytes("UTF8");
			  	byte[] enc = ecipher.doFinal(utf8);

			// encode to base64
			  	Base64 codec = new Base64();
			  	byte[] encoded= codec.encodeBase64(enc);
			  	String encoded_str=new String(encoded);
			  	return encoded_str;
			  } catch (Exception e) {
			  	e.printStackTrace();
			  }

		  return null;
		}
}
