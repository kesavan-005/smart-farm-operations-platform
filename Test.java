import org.springframework.ai.openai.OpenAiChatOptions;
import java.lang.reflect.Method;
public class Test {
    public static void main(String[] args) {
        for (Method m : OpenAiChatOptions.Builder.class.getDeclaredMethods()) {
            if (m.getName().toLowerCase().contains("reason") || m.getName().toLowerCase().contains("think")) {
                System.out.println(m.getName());
            }
        }
    }
}
