import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { cn } from "./utils";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Globe, Phone, MapPin, Wallet, Zap, Headphones } from "lucide-react";

function isAppRouteHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

const InfoIcon = ({ type }: { type: "website" | "phone" | "address" }) => {
  const icons = {
    website: <Globe className="h-5 w-5 text-primary" />,
    phone: <Phone className="h-5 w-5 text-primary" />,
    address: <MapPin className="h-5 w-5 text-primary" />,
  };
  return <div className="mr-2 flex-shrink-0">{icons[type]}</div>;
};

const FeatureIcon = ({
  type,
}: {
  type: "wallet" | "zap" | "headphones";
}) => {
  const icons = {
    wallet: <Wallet className="h-5 w-5 text-primary" />,
    zap: <Zap className="h-5 w-5 text-primary" />,
    headphones: <Headphones className="h-5 w-5 text-primary" />,
  };
  return <div className="mr-2 flex-shrink-0">{icons[type]}</div>;
};

/** Easing: smooth SaaS-style motion (not snappy / not bouncy). */
const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;
/** Long deceleration — reads more “cinematic” / premium on large type. */
const EASE_CINEMA = [0.16, 1, 0.3, 1] as const;

const WORD_STAGGER_SEC = 0.072;
const HEADING_FIRST_WORD_DELAY = 0.14;

interface HeroSectionProps {
  className?: string;
  logo?: {
    url: string;
    alt: string;
    text?: string;
  };
  slogan?: string;
  title: React.ReactNode;
  /** Optional word or phrase to style as brand accent + subtle hover emphasis (string titles only). */
  titleHighlight?: string;
  subtitle: string;
  callToAction: {
    text: string;
    href: string;
  };
  /** Single hero panel image (legacy). Ignored when `backgroundImages` is set. */
  backgroundImage?: string;
  /** Multiple images for the right hero panel; cycles with a flip animation. */
  backgroundImages?: string[];
  /** Seconds between image changes when multiple images are provided. Default 6. */
  heroImageIntervalSec?: number;
  contactInfo?: {
    website: string;
    phone: string;
    address: string;
  };
  features?: Array<{
    label: string;
    icon: "wallet" | "zap" | "headphones";
  }>;
}

function stripTrailingPunctuation(word: string) {
  return word.replace(/[.,!?;:'"')\]]+$/g, "");
}

function HeroAnimatedHeading({
  title,
  titleHighlight,
  className,
}: {
  title: string;
  titleHighlight?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const words = title.trim().split(/\s+/).filter(Boolean);
  const highlightLower = titleHighlight?.trim().toLowerCase();

  const wordEnter = (i: number) =>
    reduceMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 28 };

  const wordTransition = (i: number) =>
    reduceMotion
      ? { duration: 0 }
      : {
          duration: 0.68,
          delay: HEADING_FIRST_WORD_DELAY + i * WORD_STAGGER_SEC,
          ease: EASE_CINEMA,
        };

  return (
    <motion.div
      className={cn(className)}
      animate={
        reduceMotion
          ? undefined
          : {
              y: [0, -2, 0],
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
      style={reduceMotion ? undefined : { willChange: "transform" }}
    >
      <span className="flex flex-wrap gap-x-[0.22em] gap-y-1">
        {words.map((rawWord, i) => {
          const stripped = stripTrailingPunctuation(rawWord);
          const trailing = rawWord.slice(stripped.length);
          const isAccent =
            Boolean(highlightLower) &&
            stripped.toLowerCase() === highlightLower;

          return (
            <span key={`${rawWord}-${i}`} className="inline-flex items-baseline whitespace-nowrap">
              <motion.span
                className={cn(
                  "inline-block text-black",
                  isAccent && "text-primary"
                )}
                initial={wordEnter(i)}
                animate={{ opacity: 1, y: 0 }}
                transition={wordTransition(i)}
                {...(isAccent && !reduceMotion
                  ? {
                      whileHover: {
                        scale: 1.028,
                        textShadow: "0 0 32px hsl(var(--primary) / 0.35)",
                      },
                    }
                  : {})}
              >
                {stripped}
              </motion.span>
              {trailing ? (
                <motion.span
                  className="inline-block text-black"
                  initial={wordEnter(i)}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.52,
                          delay:
                            HEADING_FIRST_WORD_DELAY + i * WORD_STAGGER_SEC + 0.018,
                          ease: EASE_CINEMA,
                        }
                  }
                >
                  {trailing}
                </motion.span>
              ) : null}
            </span>
          );
        })}
      </span>
    </motion.div>
  );
}

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      logo,
      slogan,
      title,
      titleHighlight,
      subtitle,
      callToAction,
      backgroundImage,
      backgroundImages,
      heroImageIntervalSec = 6,
      contactInfo,
      features,
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion();

    const images = useMemo(() => {
      if (backgroundImages?.length) return backgroundImages;
      if (backgroundImage) return [backgroundImage];
      return [];
    }, [backgroundImage, backgroundImages]);

    const [heroImageIndex, setHeroImageIndex] = useState(0);

    const imagesKey = images.join("|");

    useEffect(() => {
      setHeroImageIndex(0);
    }, [imagesKey]);

    useEffect(() => {
      if (images.length < 2) return;
      const ms = Math.max(3, heroImageIntervalSec) * 1000;
      const id = window.setInterval(() => {
        setHeroImageIndex((i) => (i + 1) % images.length);
      }, ms);
      return () => window.clearInterval(id);
    }, [images.length, heroImageIntervalSec]);

    /** Last slide (phone mockup) reads better with a slight zoom inside the diagonal clip. */
    const zoomLastHeroSlide =
      images.length > 1 && heroImageIndex === images.length - 1;

    const titleString = typeof title === "string" ? title : "";
    const wordCount = titleString.trim().split(/\s+/).filter(Boolean).length;
    const headingRevealEnd =
      typeof title === "string"
        ? HEADING_FIRST_WORD_DELAY +
          Math.max(wordCount, 1) * WORD_STAGGER_SEC +
          0.58
        : 0.75;
    const dividerDelay = Math.max(0, headingRevealEnd - 0.2);
    const subtitleDelay = headingRevealEnd + 0.06;
    const ctaDelay = headingRevealEnd + 0.2;

    return (
      <motion.section
        ref={ref}
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-gradient-to-br from-[#FAFAFA] via-[#F8F8F8] to-[#F3F3F3] text-foreground md:flex-row",
          className
        )}
        initial={{ opacity: reduceMotion ? 1 : 0.985 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.75,
          ease: EASE_CINEMA,
        }}
      >
        {/* Left Side: Content */}
        <div className="relative z-10 flex w-full flex-col justify-between bg-transparent pt-24 pb-8 pl-8 pr-8 font-sans md:w-1/2 md:pt-28 md:pb-12 md:pl-12 md:pr-12 lg:w-3/5 lg:pt-32 lg:pb-16 lg:pl-16 lg:pr-16">
          <div>
            {logo ? (
              <motion.header
                className="mb-12"
                initial={
                  reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.62,
                  ease: EASE_CINEMA,
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <img
                    src={logo.url}
                    alt={logo.alt}
                    width={320}
                    height={120}
                    className="h-10 w-auto max-w-[min(260px,85vw)] object-contain object-left md:h-12"
                  />
                  {slogan ? (
                    <p className="text-xs tracking-wider text-muted-foreground sm:ml-1">
                      {slogan}
                    </p>
                  ) : null}
                </div>
              </motion.header>
            ) : null}

            <main>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                {typeof title === "string" ? (
                  <HeroAnimatedHeading
                    title={title}
                    titleHighlight={titleHighlight}
                  />
                ) : (
                  <motion.div
                    className="text-black"
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            y: [0, -2, 0],
                          }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            duration: 14,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                    }
                    style={reduceMotion ? undefined : { willChange: "transform" }}
                  >
                    <motion.div
                      initial={
                        reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.72,
                        ease: EASE_CINEMA,
                        delay: reduceMotion ? 0 : 0.1,
                      }}
                    >
                      {title}
                    </motion.div>
                  </motion.div>
                )}
              </h1>
              <motion.div
                className="my-6 h-1 w-20 origin-left bg-primary"
                initial={
                  reduceMotion
                    ? { scaleX: 1, opacity: 1 }
                    : { scaleX: 0, opacity: 0 }
                }
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  delay: reduceMotion ? 0 : dividerDelay,
                  duration: reduceMotion ? 0 : 0.68,
                  ease: EASE_CINEMA,
                }}
              />
              <motion.p
                className="mb-8 max-w-md text-lg font-normal text-foreground md:text-xl"
                initial={
                  reduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 20, filter: "blur(6px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: reduceMotion ? 0 : subtitleDelay,
                  duration: reduceMotion ? 0 : 0.78,
                  ease: EASE_CINEMA,
                }}
              >
                {subtitle}
              </motion.p>
              {isAppRouteHref(callToAction.href) ? (
                <motion.div
                  initial={
                    reduceMotion
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 12, scale: 0.985 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: reduceMotion ? 0 : ctaDelay,
                    duration: reduceMotion ? 0 : 0.64,
                    ease: EASE_CINEMA,
                  }}
                >
                  <Link
                    to={callToAction.href}
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-bold tracking-wide text-primary-foreground shadow-md transition-colors hover:bg-primary-hover"
                  >
                    {callToAction.text}
                  </Link>
                </motion.div>
              ) : (
                <motion.a
                  href={callToAction.href}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-bold tracking-wide text-primary-foreground shadow-md transition-colors hover:bg-primary-hover"
                  initial={
                    reduceMotion
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 12, scale: 0.985 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: reduceMotion ? 0 : ctaDelay,
                    duration: reduceMotion ? 0 : 0.64,
                    ease: EASE_CINEMA,
                  }}
                >
                  {callToAction.text}
                </motion.a>
              )}
            </main>
          </div>

          {(contactInfo || features) && (
            <motion.footer
              className="mt-12 w-full"
              initial={
                reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : ctaDelay + 0.22,
                duration: reduceMotion ? 0 : 0.62,
                ease: EASE_CINEMA,
              }}
            >
              <div className="grid grid-cols-1 gap-6 text-xs font-medium text-foreground sm:grid-cols-3">
                {features
                  ? features.map((item) => (
                      <div key={item.label} className="flex items-center">
                        <FeatureIcon type={item.icon} />
                        <span>{item.label}</span>
                      </div>
                    ))
                  : contactInfo && (
                      <>
                        <div className="flex items-center">
                          <InfoIcon type="website" />
                          <span>{contactInfo.website}</span>
                        </div>
                        <div className="flex items-center">
                          <InfoIcon type="phone" />
                          <span>{contactInfo.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <InfoIcon type="address" />
                          <span>{contactInfo.address}</span>
                        </div>
                      </>
                    )}
              </div>
            </motion.footer>
          )}
        </div>

        {/* Right Side: diagonal clip defines the shape; image covers the full panel (object-cover) */}
        <motion.div
          className="relative z-10 w-full min-h-[min(52vh,560px)] overflow-hidden bg-transparent md:w-1/2 md:min-h-full lg:w-2/5"
          initial={{
            clipPath: reduceMotion
              ? "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)"
              : "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
          }}
          animate={{
            clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)",
          }}
          transition={{
            duration: reduceMotion ? 0 : 1.45,
            ease: EASE_CINEMA,
          }}
        >
          <div
            className="absolute inset-0 overflow-hidden [perspective:1200px]"
            role="region"
            aria-label="Hero images"
          >
            {images.length === 0 ? null : images.length === 1 ? (
              <>
                <img
                  src={images[0]}
                  alt=""
                  className="h-full w-full scale-[1.01] object-cover object-center contrast-[1.06] brightness-[1.08] saturate-[1.03] [image-rendering:auto] will-change-transform transform-gpu"
                  decoding="async"
                />
                <svg
                  className="pointer-events-none absolute inset-0 z-[12] h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <line
                    x1="30"
                    y1="0"
                    x2="0"
                    y2="100"
                    className="stroke-primary/25"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div
                  className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-black/5 via-transparent to-black/20"
                  aria-hidden
                />
              </>
            ) : (
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={heroImageIndex}
                  className="absolute inset-0 h-full w-full overflow-hidden"
                  initial={{ opacity: 0, rotateY: 72 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -72 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <img
                    src={images[heroImageIndex]}
                    alt=""
                    className={cn(
                      "h-full w-full object-cover object-center contrast-[1.06] brightness-[1.08] saturate-[1.03] [image-rendering:auto] will-change-transform transform-gpu transition-transform duration-500",
                      zoomLastHeroSlide
                        ? "scale-[1.19] [object-position:center_42%]"
                        : "scale-[1.01]"
                    )}
                    decoding="async"
                  />
                  <svg
                    className="pointer-events-none absolute inset-0 z-[12] h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <line
                      x1="30"
                      y1="0"
                      x2="0"
                      y2="100"
                      className="stroke-primary/25"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div
                    className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-black/5 via-transparent to-black/20"
                    aria-hidden
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.section>
    );
  }
);

HeroSection.displayName = "HeroSection";

export { HeroSection };
