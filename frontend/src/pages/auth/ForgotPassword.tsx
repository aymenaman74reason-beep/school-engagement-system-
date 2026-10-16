import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { api } from "../../services/api";

const schema = yup
  .object({
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
  })
  .required();

export function ForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      setError(null);
      await api.post("/auth/forgot-password", data);
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center animate-in fade-in zoom-in-95">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          Check your email
        </h3>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          We have sent a password reset link to your email address.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Reset password</h3>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email address to receive a password reset link.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 text-center">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@school.com"
            className="pl-9"
            {...register("email")}
            error={errors.email?.message}
          />
        </div>

        <Button type="submit" className="w-full mt-6" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link
          to="/login"
          className="font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
        </Link>
      </div>
    </div>
  );
}
