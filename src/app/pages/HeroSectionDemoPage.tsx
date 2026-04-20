import React from "react";
import { HeroSection } from "../components/ui/hero-section-2";

export default function HeroSectionDemo() {
  return (
    <div className="w-full">
      <HeroSection
        logo={{
          url: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=96&h=96&fit=crop",
          alt: "Company Logo",
          text: "Caretip",
        }}
        slogan="ELEVATE YOUR PERSPECTIVE"
        title={
          <>
            Each Peak <br />
            <span className="text-primary">Teaches Something</span>
          </>
        }
        subtitle="Discover breathtaking landscapes and challenge yourself with our guided mountain expeditions. Join a community of adventurers."
        callToAction={{
          text: "JOIN US TO EXPLORE",
          href: "#explore",
        }}
        backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&auto=format&fit=crop&q=80"
        contactInfo={{
          website: "caretip.com",
          phone: "+1 (555) 123-4567",
          address: "20 Fieldstone Dr, Roswell, GA",
        }}
      />
    </div>
  );
}
