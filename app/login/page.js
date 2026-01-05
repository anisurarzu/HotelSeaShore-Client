"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, Lock, Waves, Shell, Anchor, User, Globe } from "lucide-react";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";

const HotelSeaShoreLogin = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lang, setLang] = useState("en");

  const translations = {
    bn: {
      title: "হোটেল সি শোর এ স্বাগতম",
      subtitle: "আপনার সম্পূর্ণ হোটেল ব্যবস্থাপনা সমাধান",
      userID: "ইউজার আইডি",
      password: "পাসওয়ার্ড",
      login: "লগইন করুন",
      loginIDPlaceholder: "HSS-1234",
      passwordPlaceholder: "আপনার পাসওয়ার্ড লিখুন",
      helpText: "আপনার ইউজার আইডি এবং পাসওয়ার্ড ব্যবহার করুন",
      required: "এই ফিল্ডটি প্রয়োজনীয়",
      loggingIn: "লগইন হচ্ছে...",
      signingIn: "Signing in..",
      selectHotel: "হোটেল নির্বাচন করুন",
      noHotels: "আপনার অ্যাকাউন্টে কোনো হোটেল নেই। অ্যাডমিনিস্ট্রেটর সাথে যোগাযোগ করুন।",
      logout: "লগআউট",
    },
    en: {
      title: "Welcome to Hotel Sea Shore",
      subtitle: "Your Complete Hotel Management Solution",
      userID: "User ID",
      password: "Password",
      login: "Sign In",
      loginIDPlaceholder: "Enter your user ID",
      passwordPlaceholder: "Enter your password",
      helpText: "Use your user ID and password to login",
      required: "This field is required",
      loggingIn: "Logging in...",
      signingIn: "Signing in...",
      selectHotel: "SELECT YOUR HOTEL",
      noHotels: "No hotels assigned to your account. Please contact administrator.",
      logout: "LOGOUT",
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

        // HotelID 21 diye direct dashboard e pathano
        const hotelID = "21";
        router.push(`/dashboard?hotelID=${hotelID}`);
        
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-96 opacity-20">
          <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="url(#wave-gradient)" fillOpacity="0.4" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
              <animate attributeName="d" dur="8s" repeatCount="indefinite" values="
                M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,160L48,154.7C96,149,192,139,288,154.7C384,171,480,213,576,213.3C672,213,768,171,864,138.7C960,107,1056,85,1152,90.7C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </path>
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute top-20 left-[10%] animate-float">
          <Shell className="w-12 h-12 text-cyan-300 opacity-40" />
        </div>
        <div className="absolute top-40 right-[15%] animate-float-delayed">
          <Waves className="w-16 h-16 text-teal-300 opacity-30" />
        </div>
        <div className="absolute bottom-40 left-[20%] animate-float-slow">
          <Anchor className="w-12 h-12 text-blue-300 opacity-35" />
        </div>
        
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-cyan-200 rounded-full opacity-40 animate-bubble" />
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-blue-200 rounded-full opacity-30 animate-bubble-delayed" />
        <div className="absolute bottom-1/3 left-1/2 w-5 h-5 bg-teal-200 rounded-full opacity-35 animate-bubble-slow" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-teal-600 p-6 text-white">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYg২.৬৮৬gNiA২s-২.৬৮৬g৬-৬g৬-৬-২.৬৮৬-৬-৬ ২.৬৮৬-৬g৬-৬n৪০g৩z৬s৩.৩১৪g০g৬g২.৬৮৬g৬-৬g৬-৬-২.৬৮৬-৬-৬ ২.৬৮৬-৬g৬-৬ZoiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMyIvPjwvZz48L3N2Zz4=')] opacity-50" />
              
              <div className="relative flex items-center justify-center mb-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                  <Waves className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-center mb-1">
                Hotel Sea Shore
              </h1>
              <p className="text-center text-cyan-50 text-xs font-medium">
                Management Portal
              </p>
              
              <div className="mt-3 text-center text-xs text-cyan-100 font-medium">
                {currentTime.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                <br />
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div className="p-6">
              {/* Language Toggle */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setLang(lang === "bn" ? "en" : "bn")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded-full transition-colors text-cyan-700 font-medium text-xs"
                >
                  <Globe className="w-3 h-3" />
                  <span>{lang === "bn" ? "EN" : "BN"}</span>
                </button>
              </div>

              {/* Error Alert */}
              {loginError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-red-500 text-sm">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-700 text-sm font-medium">{loginError}</p>
                  </div>
                  <button
                    onClick={() => setLoginError("")}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Form */}
              <Formik
                initialValues={{ loginID: "", password: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ values, handleChange, handleBlur, setFieldTouched }) => (
                  <Form className="space-y-4">
                    {/* User ID Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {t.userID}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <User className="w-4 h-4" />
                        </div>
                        <Field
                          name="loginID"
                          as="input"
                          type="text"
                          placeholder={t.loginIDPlaceholder}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white transition-all text-sm"
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
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {t.password}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <Field
                          name="password"
                          as="input"
                          type={showPassword ? "text" : "password"}
                          placeholder={t.passwordPlaceholder}
                          className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white transition-all text-sm"
                          onChange={(e) => {
                            handleChange(e);
                            setLoginError("");
                          }}
                          onBlur={() => setFieldTouched("password", true)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Field
                          type="checkbox"
                          name="remember"
                          className="w-3 h-3 text-cyan-600 border-gray-300 rounded focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                        />
                        <span className="text-xs text-gray-600">Remember me</span>
                      </label>
                      <button
                        type="button"
                        className="text-xs font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-600 hover:from-cyan-600 hover:via-blue-600 hover:to-teal-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>
                            {lang === "bn" ? t.loggingIn : t.signingIn}
                          </span>
                        </div>
                      ) : (
                        <span>{t.login}</span>
                      )}
                    </button>
                  </Form>
                )}
              </Formik>

              <div className="text-center space-y-1 mt-4">
                <p className="text-xs text-gray-600">
                  Contact support: <span className="font-semibold text-cyan-600">support@hotelseashore.com</span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-500">
                  Developed by <span className="font-semibold text-gray-700">Cox Web Solutions</span>
                </p>
                <p className="text-xs text-gray-400">
                  © 2026 Hotel Sea Shore. All rights reserved.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-white/50">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-700">System Online</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(0.8); opacity: 0; }
        }
        
        @keyframes bubble-delayed {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-100vh) scale(0.9); opacity: 0; }
        }
        
        @keyframes bubble-slow {
          0% { transform: translateY(0) scale(1); opacity: 0.35; }
          50% { opacity: 0.55; }
          100% { transform: translateY(-100vh) scale(0.85); opacity: 0; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-bubble {
          animation: bubble 15s ease-in infinite;
        }
        
        .animate-bubble-delayed {
          animation: bubble-delayed 18s ease-in infinite;
          animation-delay: 3s;
        }
        
        .animate-bubble-slow {
          animation: bubble-slow 20s ease-in infinite;
          animation-delay: 6s;
        }
      `}</style>
    </div>
  );
};

export default HotelSeaShoreLogin;