You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
glowing-card.tsx
"use client" 

import * as React from "react"
import { cn } from "@/lib/utils"

interface GridBackgroundProps {
  title: string
  description: string
  showAvailability?: boolean
  className: string
}

export function GridBackground({
  title,
  description,
  showAvailability = true,
  className,
}: GridBackgroundProps) {
  return (
    <div 
      className={cn(
        'px-10 py-20 rounded-md relative mx-18 flex items-center justify-center',
        className
      )}
      style={{
        backgroundColor: 'rgba(15, 15, 15, 1)',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}
    >
      <div 
        className="w-3 h-3 rounded-full absolute shadow-[0_0_15px] shadow-current z-10 bg-current"
        style={{
          animation: `
            border-follow 6s linear infinite,
            color-change 6s linear infinite
          `
        }}
      />
      <div 
        className="absolute inset-0 border-2 rounded-md"
        style={{
          animation: 'border-color-change 6s linear infinite'
        }}
      />

      <div className="relative z-20 text-center max-w-7xl">
        <h1 className='text-6xl font-bold'>{title}</h1>
        {description && (
          <p className='text-md mt-5 text-gray-300'>{description}</p>
        )}

        {showAvailability && (
          <div className="available-now text-[#20bb5a] text-sm flex items-center justify-center mt-5">
            <div className="w-2 h-2 bg-[#20bb5a] rounded-full inline-block mr-2 animate-pulse shadow-[0_0_8px_#20bb5a]" />
            Call Now
          </div>
        )}
      </div>
    </div>
  )
} 

demo.tsx
"use client";

import * as React from "react"
import { GridBackground } from "@/components/ui/glowing-card"


export function GridBackgroundDemo() {
  return (
      <GridBackground
        title='Welcome to JatinVerse'
        description="Transforming your ideas into stunning visual experiences. Explore the world of creative design with us."
      />
  )
} 
```

Extend existing globals.css with this code:
```css
@keyframes border-follow {
  0% {
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
  }
  25% {
    left: 100%;
    top: 0;
    transform: translate(-50%, -50%);
  }
  50% {
    left: 100%;
    top: 100%;
    transform: translate(-50%, -50%);
  }
  75% {
    left: 0;
    top: 100%;
    transform: translate(-50%, -50%);
  }
  100% {
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
  }
}

@keyframes color-change {
  0% {
    color: #3b82f6; 
  }
  33% {
    color: #ef4444;
  }
  66% {
    color: #22c55e;
  }
  100% {
    color: #3b82f6; 
  }
}

@keyframes border-color-change {
  0% {
    border-color: #3b82f6; 
  }
  33% {
    border-color: #ef4444;
  }
  66% {
    border-color: #22c55e;
  }
  100% {
    border-color: #3b82f6; 
  }
}

```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
