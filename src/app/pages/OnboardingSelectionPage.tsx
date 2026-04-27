import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Building2, Users, ArrowRight, X } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { PREMIUM_GRADIENTS, SHADOWS } from '@/lib/premiumUIDesignSystem';

export function OnboardingSelectionPage() {
  const navigate = useNavigate();

  const handleBusinessSelect = () => {
    navigate('/signup?role=business', { replace: true });
  };

  const handleStaffSelect = () => {
    navigate('/signup?role=employee', { replace: true });
  };

  const handleClose = () => {
    navigate('/', { replace: true });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white">
      <Navigation />
      
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Close button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleClose}
          className="absolute top-24 right-4 sm:right-6 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </motion.button>

        <motion.div
          className="w-full max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div
            className="mb-12 text-center"
            variants={itemVariants}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How do you want to join <span className="text-[#EB992C]">CareTip</span>?
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Choose your account type to get started with secure tipping and payouts.
            </p>
          </motion.div>

          {/* Selection Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Business Card */}
            <motion.button
              onClick={handleBusinessSelect}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 p-8 text-left"
              style={{ boxShadow: SHADOWS.SOFT }}
            >
              {/* Premium gradient background overlay */}
              <div className="absolute inset-0" style={{ background: PREMIUM_GRADIENTS.CREAM_WHITE, opacity: 0.5 }} />
              
              {/* 3D accent glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange-100/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 group-hover:scale-120 transition-transform duration-300 blur-2xl" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* 3D Icon Container */}
                <motion.div 
                  className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 transition-all duration-300 group-hover:shadow-md border border-orange-200/50"
                  style={{ boxShadow: SHADOWS.MEDIUM }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Building2 className="h-8 w-8 text-[#EB992C]" />
                </motion.div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#EB992C] transition-colors">
                  As a Business
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Set up your restaurant, café, salon, or service business to accept tips and manage your team.
                </p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#EB992C] to-orange-400" />
                    <span>Unlimited team members</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#EB992C] to-orange-400" />
                    <span>QR code & payment management</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#EB992C] to-orange-400" />
                    <span>Real-time analytics</span>
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-2 text-[#EB992C] font-semibold group-hover:translate-x-1 transition-transform">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </motion.button>

            {/* Staff/Employee Card */}
            <motion.button
              onClick={handleStaffSelect}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 p-8 text-left"
              style={{ boxShadow: SHADOWS.SOFT }}
            >
              {/* Premium gradient background overlay */}
              <div className="absolute inset-0" style={{ background: PREMIUM_GRADIENTS.CREAM_WHITE, opacity: 0.5 }} />
              
              {/* 3D accent glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange-100/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 group-hover:scale-120 transition-transform duration-300 blur-2xl" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* 3D Icon Container */}
                <motion.div 
                  className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 transition-all duration-300 group-hover:shadow-md border border-orange-200/50"
                  style={{ boxShadow: SHADOWS.MEDIUM }}
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <Users className="h-8 w-8 text-[#EB992C]" />
                </motion.div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#EB992C] transition-colors">
                  As a Staff / Employee
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Join your business or organization to receive tips and track your earnings securely.
                </p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#EB992C] to-orange-400" />
                    <span>Fast, secure payouts</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#EB992C] to-orange-400" />
                    <span>Real-time tip notifications</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#EB992C] to-orange-400" />
                    <span>Performance tracking</span>
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-2 text-[#EB992C] font-semibold group-hover:translate-x-1 transition-transform">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* Feature note */}
          <motion.div
            className="mt-12 text-center text-sm text-gray-600"
            variants={itemVariants}
          >
            <p>Already have an account? <a href="/login" className="font-semibold text-[#EB992C] hover:underline">Sign in here</a></p>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
