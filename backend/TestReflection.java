import java.lang.reflect.*;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.openai.OpenAiChatModel;

public class TestReflection {
    public static void main(String[] args) {
        System.out.println("--- OpenAiApi Constructors ---");
        for (Constructor<?> c : OpenAiApi.class.getConstructors()) {
            System.out.println(c);
        }
        System.out.println("--- OpenAiChatModel Constructors ---");
        for (Constructor<?> c : OpenAiChatModel.class.getConstructors()) {
            System.out.println(c);
        }
    }
}
