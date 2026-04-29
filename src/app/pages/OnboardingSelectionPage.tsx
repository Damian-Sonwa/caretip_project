import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Building2, Users, ArrowRight, X } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SHADOWS } from '@/lib/premiumUIDesignSystem';

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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white dark:bg-neutral-950">
      <Navigation />
      
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Close button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleClose}
          className="absolute top-24 right-4 sm:right-6 rounded-lg p-2 text-neutral-600 transition-colors hover:bg-gray-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
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
            <h1 className="mb-4 text-4xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-5xl">
              How do you want to join <span className="text-primary">CareTip</span>?
            </h1>
            <p className="mx-auto max-w-lg text-lg text-neutral-600 dark:text-neutral-400">
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
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-left transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:border-neutral-800 dark:bg-neutral-900"
              style={{ boxShadow: SHADOWS.SOFT }}
            >
              {/* Content */}
              <div className="relative z-10">
                {/* 3D Icon Container */}
                <motion.div 
                  className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-primary/10 transition-all duration-300 group-hover:shadow-md dark:border-neutral-800"
                  style={{ boxShadow: SHADOWS.MEDIUM }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Building2 className="h-8 w-8 text-primary" />
                </motion.div>

                {/* Text */}
                <h2 className="mb-3 text-2xl font-bold text-neutral-900 transition-colors group-hover:text-primary dark:text-neutral-100">
                  As a Business
                </h2>
                <p className="mb-6 leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Set up your restaurant, café, salon, or service business to accept tips and manage your team.
                </p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Unlimited team members</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>QR code & payment management</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Real-time analytics</span>
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-2 font-semibold text-primary transition-transform group-hover:translate-x-1">
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
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-left transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:border-neutral-800 dark:bg-neutral-900"
              style={{ boxShadow: SHADOWS.SOFT }}
            >
              {/* Content */}
              <div className="relative z-10">
                {/* 3D Icon Container */}
                <motion.div 
                  className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-primary/10 transition-all duration-300 group-hover:shadow-md dark:border-neutral-800"
                  style={{ boxShadow: SHADOWS.MEDIUM }}
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <Users className="h-8 w-8 text-primary" />
                </motion.div>

                {/* Text */}
                <h2 className="mb-3 text-2xl font-bold text-neutral-900 transition-colors group-hover:text-primary dark:text-neutral-100">
                  As a Staff / Employee
                </h2>
                <p className="mb-6 leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Join your business or organization to receive tips and track your earnings securely.
                </p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Fast, secure payouts</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Real-time tip notifications</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Performance tracking</span>
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-2 font-semibold text-primary transition-transform group-hover:translate-x-1">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* Feature note */}
          <motion.div
            className="mt-12 text-center text-sm text-neutral-600 dark:text-neutral-400"
            variants={itemVariants}
          >
            <p>
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-primary hover:underline">
                Sign in here
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
