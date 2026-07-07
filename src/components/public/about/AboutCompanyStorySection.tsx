import { useTranslation } from "react-i18next";
import aboutTeamImg from "../../../../images/about-team.jpeg";
import missionImg from "../../../../images/caretip-mission001.png";
import { cn } from "@/lib/utils";
import { usePublicScrollReveal } from "@/lib/usePublicScrollReveal";

export function AboutCompanyStorySection() {
  const { t } = useTranslation();
  const originTextReveal = usePublicScrollReveal<HTMLDivElement>(0);
  const originVisualReveal = usePublicScrollReveal<HTMLDivElement>(0.06);
  const visionTextReveal = usePublicScrollReveal<HTMLDivElement>(0);
  const visionVisualReveal = usePublicScrollReveal<HTMLDivElement>(0.06);

  return (
    <>
      {/* Origin story — split layout (template: founders + photo) */}
      <section className="caretip-about-split" aria-labelledby="about-story-title">
        <div className="caretip-about-page__inner caretip-about-split__grid">
          <div
            ref={originTextReveal.ref}
            style={originTextReveal.style}
            className={cn(originTextReveal.className, "caretip-about-split__copy")}
          >
            <p className="caretip-about-split__eyebrow">{t("staticPages.about.story.eyebrow")}</p>
            <h2 id="about-story-title" className="caretip-about-split__headline">
              {t("staticPages.about.story.title")}
            </h2>
            <div className="caretip-about-split__prose">
              <p>{t("staticPages.about.story.intro")}</p>
              <p>{t("staticPages.about.story.origin")}</p>
            </div>
          </div>

          <div
            ref={originVisualReveal.ref}
            style={originVisualReveal.style}
            className={cn(originVisualReveal.className, "caretip-about-split__media")}
          >
            <img
              src={aboutTeamImg}
              alt=""
              className="caretip-about-split__photo caretip-marketing-img caretip-marketing-img--ready"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* Founder quote — dark mission band (template: OUR MISSION) */}
      <section className="caretip-about-quote-band" aria-labelledby="about-quote-text">
        <div className="caretip-about-page__inner caretip-about-quote-band__inner">
          <blockquote className="caretip-about-quote-band__quote">
            <p id="about-quote-text">{t("staticPages.about.story.quote")}</p>
            <footer className="caretip-about-quote-band__footer">
              {t("staticPages.about.story.quoteAttribution")}
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Vision & drive — split with product showcase (template: Wise today) */}
      <section className="caretip-about-split caretip-about-split--product" aria-labelledby="about-vision-title">
        <div className="caretip-about-page__inner caretip-about-split__grid">
          <div
            ref={visionTextReveal.ref}
            style={visionTextReveal.style}
            className={cn(visionTextReveal.className, "caretip-about-split__copy")}
          >
            <h2 id="about-vision-title" className="caretip-about-split__headline">
              {t("staticPages.about.story.visionTitle")}
            </h2>
            <div className="caretip-about-split__prose">
              <p>{t("staticPages.about.story.visionP1")}</p>
              <p>{t("staticPages.about.story.visionP2")}</p>
            </div>

            <h3 className="caretip-about-split__subhead">{t("staticPages.about.story.driveTitle")}</h3>
            <div className="caretip-about-split__prose">
              <p>{t("staticPages.about.story.driveBody")}</p>
              <p className="caretip-about-split__closing">{t("staticPages.about.story.driveClosing")}</p>
            </div>
          </div>

          <div
            ref={visionVisualReveal.ref}
            style={visionVisualReveal.style}
            className={cn(visionVisualReveal.className, "caretip-about-split__media caretip-about-split__media--product")}
          >
            <div className="caretip-about-split__showcase caretip-about-split__showcase--mission">
              <div className="caretip-about-split__showcase-glow" aria-hidden />
              <img
                src={missionImg}
                alt={t("staticPages.about.story.visionTitle")}
                className="caretip-about-split__product caretip-about-split__product--mission caretip-marketing-img caretip-marketing-img--ready"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
