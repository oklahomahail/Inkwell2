# Page snapshot

```yaml
- generic [ref=e2]:
    - banner [ref=e3]:
        - link "Sign in" [ref=e5] [cursor=pointer]:
            - /url: /sign-in
    - generic [ref=e7]:
        - img "Inkwell" [ref=e9]
        - heading "Sign in to Inkwell" [level=2] [ref=e10]
        - paragraph [ref=e11]: Welcome back, pick up where you left off.
        - generic [ref=e12]:
            - banner [ref=e13]:
                - img "Inkwell" [ref=e14]
                - heading "Sign in to Inkwell" [level=1] [ref=e15]
                - paragraph [ref=e16]: Find your story. Write it well.
                - paragraph [ref=e17]: Welcome back, pick up where you left off.
            - generic [ref=e18]:
                - generic [ref=e19]:
                    - button "Email & Password" [pressed] [ref=e20] [cursor=pointer]
                    - button "Magic Link" [ref=e22] [cursor=pointer]
                - generic [ref=e23]:
                    - generic [ref=e24]:
                        - generic [ref=e25]: Email address
                        - textbox "Email address" [ref=e26]:
                            - /placeholder: Enter your email
                    - generic [ref=e27]:
                        - generic [ref=e28]: Password
                        - textbox "Password" [ref=e29]:
                            - /placeholder: Enter your password
                        - link "Forgot your password?" [ref=e31] [cursor=pointer]:
                            - /url: /auth/forgot-password
                - button "Sign in" [ref=e32] [cursor=pointer]
                - paragraph [ref=e33]: Trouble signing in? Try the Magic Link tab for password-free sign in.
            - generic [ref=e34]:
                - text: Don't have an account?
                - link "Sign up" [ref=e35] [cursor=pointer]:
                    - /url: /sign-up
```
