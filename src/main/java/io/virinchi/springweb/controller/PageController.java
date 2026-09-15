package io.virinchi.springweb.controller;

import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class PageController {
    private static final Set<String> PAGES = Set.of(
            "login",
            "register",
            "photographers",
            "packages",
            "about",
            "contact",
            "photographer-profile",
            "dashboard-client",
            "dashboard-photographer",
            "dashboard-admin"
    );

    @GetMapping({"/", "/index.html"})
    public String index() {
        return "index";
    }

    @GetMapping("/pages/{page}")
    public String page(@PathVariable String page) {
        String viewName = normalizePage(page);
        if (!PAGES.contains(viewName)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found");
        }

        return "pages/" + viewName;
    }

    @GetMapping("/pages/pages/{page}")
    public String legacyPage(@PathVariable String page) {
        String viewName = normalizePage(page);
        if (!PAGES.contains(viewName)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found");
        }

        return "redirect:/pages/" + page;
    }

    private String normalizePage(String page) {
        return page.endsWith(".html")
                ? page.substring(0, page.length() - ".html".length())
                : page;
    }

    @GetMapping("/favicon.ico")
    public String favicon() {
        return "redirect:/assets/favicon/camera-32.png";
    }
}
