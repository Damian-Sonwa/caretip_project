import React, { useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useMediaQuery } from '@react-hook/media-query';

interface Testimonial {
  image?: string;
  text: string;
  name: string;
  jobtitle: string;
  rating: number;
}

interface ComponentProps {
  testimonials: Testimonial[];
}

export const BookTestimonial = ({ testimonials }: ComponentProps) => {
  const book = useRef<typeof HTMLFlipBook>(null);

  const isSmallScreen = useMediaQuery('(min-width: 640px)');
  const smallerDevice = isSmallScreen ? false : true;

  type FlipRef = { pageFlip: () => { flip: (n: number) => void; flipNext: (b: boolean) => void } };
  const handleFlip = (pageNum: number) => {
    const inst = book.current as unknown as FlipRef | null;
    inst?.pageFlip()?.flip(pageNum);
    inst?.pageFlip()?.flipNext(false);
  };

  return (
    <div className="w-full text-black min-h-[500px] flex justify-center items-center py-10">
      <HTMLFlipBook
        ref={book}
        width={300}
        height={450}
        showCover={true}
        usePortrait={smallerDevice}
        onFlip={() => {}}
        onChangeState={() => {}}
        className={''}
        style={{}}
        startPage={0}
        size={'fixed'}
        minWidth={0}
        maxWidth={0}
        minHeight={0}
        maxHeight={0}
        drawShadow={true}
        flippingTime={1000}
        startZIndex={0}
        autoSize={false}
        maxShadowOpacity={0}
        mobileScrollSupport={true}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={0}
        showPageCorners={true}
        disableFlipByClick={false}
      >
        {/* Cover Page */}
        <div className="relative bg-gradient-to-br from-[#384D48] to-[#14BDEB] border rounded-lg p-8 text-white flex flex-col items-center justify-center shadow-2xl cursor-grab">
          <div className="flex justify-center items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L18 8V16L12 20L6 16V8L12 4Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 12V20" stroke="white" strokeWidth="2"/>
                <path d="M6 8L12 12L18 8" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-12 text-center relative z-10">Tipping</h1>
          <div className="w-full h-1 bg-white/50 mb-6 relative z-10"></div>
          <div className="text-center">
            <span className="text-lg text-white text-center hover:text-white/80 transition-colors duration-300 relative z-10">
              What People Say About Us
            </span>
          </div>
        </div>

        {/* Index Page */}
        <div className="w-full h-full flex justify-center items-center bg-zinc-100 border border-gray-300 box-border">
          <div className="page-front text-start text-white p-3 bg-[#384D48]">Index</div>
          <div className="flex flex-col justify-start items-start p-8 space-y-3">
            <div>
              <ol className="grid grid-cols-2 gap-2">
                {testimonials.map((testimonial, index) => (
                  <React.Fragment key={index}>
                    <li
                      onClick={() => handleFlip(index + 2)}
                      className="flex justify-start items-center text-xs cursor-pointer hover:text-[#14BDEB] transition-colors"
                    >
                      <img
                        src={testimonial.image || ''}
                        alt={testimonial.name}
                        width={20}
                        height={20}
                        className="rounded-full mr-2 object-cover"
                      />
                      {testimonial.name}
                    </li>
                    <li className="flex justify-end text-xs items-center">{index + 2}</li>
                  </React.Fragment>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Testimonial Pages */}
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="w-full h-full flex justify-center items-center bg-gray-50 border border-gray-300 box-border cursor-grab"
          >
            <div className="page-front text-end text-white p-3 bg-[#384D48]">{index + 2}</div>
            <div className="flex justify-center items-center mt-7">
              <img
                src={testimonial.image || ''}
                alt={testimonial.name}
                width={100}
                height={100}
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center items-center mt-3">
              <span className="font-semibold">{testimonial.name}</span>
              <span className="text-gray-500 text-sm">{testimonial.jobtitle}</span>
            </div>
            <div className="p-5 font-serif font-semibold text-center mt-2 text-sm leading-relaxed">
              {testimonial.text}
            </div>
            <div className="flex justify-center items-center mt-3">
              {[...Array(testimonial.rating)].map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#14BDEB"
                  className="size-8"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clipRule="evenodd"
                  />
                </svg>
              ))}
              {[...Array(5 - testimonial.rating)].map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#CBD5E1"
                  className="size-8"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clipRule="evenodd"
                  />
                </svg>
              ))}
            </div>
          </div>
        ))}

        {/* Thank You Page */}
        <div className="bg-gradient-to-br from-[#384D48] to-[#14BDEB] border p-8 text-white flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4 text-center font-serif">Thank You!</h1>
          <p className="text-lg text-center">We appreciate your feedback</p>
        </div>
      </HTMLFlipBook>
    </div>
  );
};
