import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import java.lang.reflect.Method;
public class GetApi {
    public static void main(String[] args) {
        System.out.println("Document methods:");
        for(Method m : Document.class.getMethods()) {
            System.out.println(m.getName() + " -> " + m.getReturnType().getSimpleName());
        }
        System.out.println("SearchRequest methods:");
        for(Method m : SearchRequest.class.getMethods()) {
            System.out.println(m.getName() + " -> " + m.getReturnType().getSimpleName());
        }
    }
}
