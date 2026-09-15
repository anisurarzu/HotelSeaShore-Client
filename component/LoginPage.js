"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, Lock, User, Globe, Phone, MessageCircle } from "lucide-react";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";
import "./LoginPage.css";

const LOGO_URL =
  "https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg";

const COX_PHONE = "+8801840452081";
const COX_PHONE_TEL = "+8801840452081";
const COX_WHATSAPP = "8801840452081";
const APP_VERSION = "v2.0";

const HotelSeaShoreLogin = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lang, setLang] = useState("en");

  const translations = {
    bn: {
      title: "হোটেল সি শোর",
      demo: "Starter",
      version: "ভার্সন ২.০",
      demoNote: "এটি একটি Starter ভার্সন — প্রো ফিচারের জন্য যোগাযোগ করুন",
      subtitle: "ম্যানেজমেন্ট পোর্টাল",
      welcome: "স্বাগতম",
      tagline: "স্মার্ট হোটেল অপারেশন · ক্যালেন্ডার, বুকিং, ক্যাশ ও রিপোর্ট",
      userID: "ইউজার আইডি",
      password: "পাসওয়ার্ড",
      login: "লগইন করুন",
      loginIDPlaceholder: "HSS-1234",
      passwordPlaceholder: "আপনার পাসওয়ার্ড লিখুন",
      required: "এই ফিল্ডটি প্রয়োজনীয়",
      loggingIn: "লগইন হচ্ছে...",
      signingIn: "Signing in...",
      remember: "মনে রাখুন",
      forgot: "পাসওয়ার্ড ভুলে গেছেন?",
      online: "সিস্টেম অনলাইন",
      proTitle: "প্রো ভার্সন চান?",
      proBody:
        "ফুল প্রোডাকশন, কাস্টম ফিচার ও সাপোর্টের জন্য Cox Web Solutions-এর সাথে যোগাযোগ করুন।",
      callNow: "কল করুন",
      whatsapp: "WhatsApp",
      developed: "ডেভেলপড বাই",
      support: "সাপোর্ট",
    },
    en: {
      title: "Hotel Sea Shore",
      demo: "Starter",
      version: "Version 2.0",
      demoNote: "You are on the Starter build — contact us to try Pro",
      subtitle: "Management Portal",
      welcome: "Welcome back",
      tagline: "Smart hotel operations · calendar, booking, cash desk & reports",
      userID: "User ID",
      password: "Password",
      login: "Sign In",
      loginIDPlaceholder: "Enter your user ID",
      passwordPlaceholder: "Enter your password",
      required: "This field is required",
      loggingIn: "Logging in...",
      signingIn: "Signing in...",
      remember: "Remember me",
      forgot: "Forgot password?",
      online: "System online",
      proTitle: "Try the Pro version",
      proBody:
        "For full production, custom features and priority support, contact Cox Web Solutions.",
      callNow: "Call now",
      whatsapp: "WhatsApp",
      developed: "Developed by",
      support: "Support",
    },
  };

  const t = translations[lang];

  const validationSchema = Yup.object({
    loginID: Yup.string().required(t.required),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .required(t.required),
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    setIsLoading(true);
    setLoginError("");

    const loginData = {
      loginID: values?.loginID,
      password: values?.password,
      loginTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };

    try {
      const response = await coreAxios.post(`auth/login`, loginData);

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userInfo", JSON.stringify(response.data.user));
        localStorage.setItem("portalType", "hotel");
        router.push(`/dashboard`);
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      setLoginError(
        error.response?.data?.error ||
          "An error occurred during login. Please try again."
      );
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="hs-auth">
      <div className="hs-auth__atmosphere" aria-hidden>
        <div className="hs-auth__glow hs-auth__glow--a" />
        <div className="hs-auth__glow hs-auth__glow--b" />
        <div className="hs-auth__mesh" />
      </div>

      <div className="hs-auth__shell">
        <aside className="hs-auth__brand">
          <div className="hs-auth__brand-top">
            <div className="hs-auth__logo">
              <img src={LOGO_URL} alt="Hotel Sea Shore" />
            </div>
            <div className="hs-auth__badges">
              <span className="hs-auth__demo">{t.demo}</span>
              <span className="hs-auth__version">{APP_VERSION}</span>
            </div>
          </div>

          <p className="hs-auth__eyebrow">Cox&apos;s Bazar · Bangladesh</p>
          <h1 className="hs-auth__name">
            {t.title}
            <span className="hs-auth__name-demo"> {t.demo}</span>
          </h1>
          <p className="hs-auth__tagline">{t.tagline}</p>
          <p className="hs-auth__demo-note">
            {t.version} · {t.demoNote}
          </p>

          <div className="hs-auth__pro">
            <p className="hs-auth__pro-title">{t.proTitle}</p>
            <p className="hs-auth__pro-body">{t.proBody}</p>
            <div className="hs-auth__pro-actions">
              <a className="hs-auth__pro-btn" href={`tel:${COX_PHONE_TEL}`}>
                <Phone size={14} />
                {t.callNow}
              </a>
              <a
                className="hs-auth__pro-btn hs-auth__pro-btn--wa"
                href={`https://wa.me/${COX_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={14} />
                {t.whatsapp}
              </a>
            </div>
            <p className="hs-auth__pro-phone">
              <strong>Cox Web Solutions</strong>
              <a href={`tel:${COX_PHONE_TEL}`}>{COX_PHONE}</a>
            </p>
          </div>

          <div className="hs-auth__clock" suppressHydrationWarning>
            {currentTime.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            <span>·</span>
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            <span>·</span>
            {APP_VERSION}
          </div>
        </aside>

        <main className="hs-auth__panel">
          <div className="hs-auth__panel-top">
            <div>
              <h2>{t.welcome}</h2>
              <p>
                {t.subtitle} · {t.demo} {APP_VERSION}
              </p>
            </div>
            <button
              type="button"
              className="hs-auth__lang"
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              aria-label="Toggle language"
            >
              <Globe size={14} />
              {lang === "bn" ? "EN" : "BN"}
            </button>
          </div>

          {loginError && (
            <div className="hs-auth__error" role="alert">
              <span>{loginError}</span>
              <button type="button" onClick={() => setLoginError("")}>
                ×
              </button>
            </div>
          )}

          <Formik
            initialValues={{ loginID: "", password: "", remember: false }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, setFieldTouched }) => (
              <Form className="hs-auth__form">
                <div className="hs-auth__field">
                  <label htmlFor="loginID">{t.userID}</label>
                  <div className="hs-auth__input">
                    <User className="hs-auth__icon" size={16} />
                    <Field
                      id="loginID"
                      name="loginID"
                      as="input"
                      type="text"
                      autoComplete="username"
                      placeholder={t.loginIDPlaceholder}
                      onChange={(e) => {
                        handleChange(e);
                        setLoginError("");
                      }}
                      onBlur={() => setFieldTouched("loginID", true)}
                    />
                  </div>
                  <ErrorMessage
                    name="loginID"
                    component="div"
                    className="hs-auth__hint"
                  />
                </div>

                <div className="hs-auth__field">
                  <label htmlFor="password">{t.password}</label>
                  <div className="hs-auth__input">
                    <Lock className="hs-auth__icon" size={16} />
                    <Field
                      id="password"
                      name="password"
                      as="input"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t.passwordPlaceholder}
                      onChange={(e) => {
                        handleChange(e);
                        setLoginError("");
                      }}
                      onBlur={() => setFieldTouched("password", true)}
                    />
                    <button
                      type="button"
                      className="hs-auth__eye"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="hs-auth__hint"
                  />
                </div>

                <div className="hs-auth__row">
                  <label className="hs-auth__check">
                    <Field type="checkbox" name="remember" />
                    {t.remember}
                  </label>
                  <button type="button" className="hs-auth__link">
                    {t.forgot}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="hs-auth__submit"
                >
                  {isLoading ? (
                    <span className="hs-auth__submit-inner">
                      <span className="hs-auth__spin" />
                      {lang === "bn" ? t.loggingIn : t.signingIn}
                    </span>
                  ) : (
                    t.login
                  )}
                </button>
              </Form>
            )}
          </Formik>

          <div className="hs-auth__pro hs-auth__pro--panel">
            <p className="hs-auth__pro-title">{t.proTitle}</p>
            <p className="hs-auth__pro-body">{t.proBody}</p>
            <div className="hs-auth__pro-actions">
              <a className="hs-auth__pro-btn" href={`tel:${COX_PHONE_TEL}`}>
                <Phone size={14} />
                {COX_PHONE}
              </a>
              <a
                className="hs-auth__pro-btn hs-auth__pro-btn--wa"
                href={`https://wa.me/${COX_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={14} />
                {t.whatsapp}
              </a>
            </div>
          </div>

          <footer className="hs-auth__foot">
            <p>
              {t.developed} <strong>Cox Web Solutions</strong> · {APP_VERSION}
            </p>
            <p>
              {t.support}{" "}
              <a href={`tel:${COX_PHONE_TEL}`}>{COX_PHONE}</a>
            </p>
          </footer>

          <div className="hs-auth__status">
            <i />
            {t.online}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HotelSeaShoreLogin;
