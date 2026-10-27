package pe.edu.vallegrande.app.util;

import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

/**
 * Convierte una parte multipart reactiva ({@link FilePart}) en un arreglo de bytes
 * sin bloquear el hilo del event loop.
 */
public final class FilePartUtils {

    private FilePartUtils() {
    }

    public static Mono<byte[]> readBytes(FilePart filePart) {
        return DataBufferUtils.join(filePart.content())
                .map(FilePartUtils::toBytes)
                .defaultIfEmpty(new byte[0]);
    }

    private static byte[] toBytes(DataBuffer buffer) {
        try {
            byte[] bytes = new byte[buffer.readableByteCount()];
            buffer.read(bytes);
            return bytes;
        } finally {
            DataBufferUtils.release(buffer);
        }
    }
}
