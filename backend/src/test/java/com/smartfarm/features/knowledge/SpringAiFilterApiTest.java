package com.smartfarm.features.knowledge;

import org.junit.jupiter.api.Test;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.ai.vectorstore.filter.Filter;

import java.lang.reflect.Method;

public class SpringAiFilterApiTest {

    @Test
    public void dumpApi() {
        System.out.println("=== SearchRequest Methods ===");
        for (Method m : SearchRequest.class.getDeclaredMethods()) {
            System.out.println(m.getName() + " -> " + m.getReturnType().getSimpleName());
            for (Class<?> p : m.getParameterTypes()) {
                System.out.println("  Param: " + p.getName());
            }
        }

        System.out.println("\n=== FilterExpressionBuilder Methods ===");
        for (Method m : FilterExpressionBuilder.class.getDeclaredMethods()) {
            System.out.println(m.getName() + " -> " + m.getReturnType().getSimpleName());
            for (Class<?> p : m.getParameterTypes()) {
                System.out.println("  Param: " + p.getName());
            }
        }
        
        System.out.println("\n=== Filter.Expression ===");
        System.out.println(Filter.Expression.class.getName());
    }
}
