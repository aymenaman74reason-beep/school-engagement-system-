import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";

const schema = yup
  .object({
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    rememberMe: yup.boolean(),
  })
  .required();

type FormData = yup.InferType<typeof schema>;

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema) as any,
  });

  const onSubmit = async (data: any) => {
    try {
      setError(null);
      // Replace with real backend call
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);

      // Redirect based on role
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to login. Please check your credentials.",
      );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Sign in to your account
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Enter your details to access your portal
        </p>
      </div>

      {sessionExpired && (
        <div className="mb-4 p-3 rounded-md bg-yellow-50 text-yellow-800 flex items-center gap-2 text-sm border border-yellow-200">
          <AlertCircle className="h-4 w-4" />
          Your session has expired. Please log in again.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 flex items-center gap-2 text-sm border border-red-200 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <Input
            label="Email or Username"
            type="email"
            placeholder="admin@school.com"
            className="pl-9"
            {...register("email")}
            error={errors.email?.message as string}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pl-9 pr-10"
            {...register("password")}
            error={errors.password?.message as string}
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              {...register("rememberMe")}
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full mt-6" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
