# Remotion Hero Animation Integration Guide

## ✅ What's Been Added

### New Components Created:

1. **`src/app/components/ui/spatial-push.tsx`**
   - Core animation component using Remotion
   - Implements spatial push effect with spring physics
   - Configurable direction (up, down, left, right)
   - Takes `from` and `to` ReactNode props for custom scene content

2. **`src/app/components/ui/animated-hero-player.tsx`**
   - Wrapper component that integrates SpatialPush with Remotion Player
   - Handles video composition and playback settings
   - Responsive design with customizable dimensions
   - Auto-play, loop, and control configurations

3. **`src/app/pages/HeroAnimationDemoPage.tsx`**
   - Demo page showcasing the animation
   - Accessible at `/hero-animation-demo` route
   - Features documentation and integration examples

### Updated Files:

- **`src/app/routes.tsx`** - Added new route `/hero-animation-demo`

## 📦 Installation Steps

### Step 1: Install Remotion Dependencies

Run one of the following commands (choose based on your package manager):

**Using npm:**
```bash
npm install remotion @remotion/player
```

**Using pnpm:**
```bash
pnpm add remotion @remotion/player
```

**Using yarn:**
```bash
yarn add remotion @remotion/player
```

### Step 2: Acknowledge Remotion License

The components already include `acknowledgeRemotionLicense` in the Player configuration. This is required to use Remotion without a license message.

### Step 3: Verify Installation

Check that dependencies were added to `package.json`:
```json
{
  "dependencies": {
    "remotion": "^5.0.0",
    "@remotion/player": "^5.0.0"
  }
}
```

### Step 4: Test the Demo

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/hero-animation-demo`

3. You should see the spatial push animation playing!

## 🎯 Integration Examples

### Basic Usage in a Hero Section

```tsx
import { AnimatedHeroPlayer } from '@/components/ui/animated-hero-player';

export function MyHeroSection() {
  return (
    <section className="relative w-full h-screen">
      <AnimatedHeroPlayer
        autoPlay={true}
        loop={true}
        controls={false}
        className="w-full h-full"
      />
    </section>
  );
}
```

### Custom Scenes with Images

```tsx
import { Player } from "@remotion/player";
import { SpatialPush } from "@/components/ui/spatial-push";

const CustomScene = () => (
  <SpatialPush
    from={
      <img 
        src="/images/scene1.jpg" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    }
    to={
      <img 
        src="/images/scene2.jpg" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    }
    direction="up"
  />
);

export function HeroWithCustomImages() {
  return (
    <Player
      component={CustomScene}
      durationInFrames={120}
      fps={30}
      compositionWidth={1280}
      compositionHeight={720}
      style={{ width: '100%', height: 'auto' }}
      autoPlay
      loop
      acknowledgeRemotionLicense
    />
  );
}
```

### With Business/Product Content

```tsx
import { Player } from "@remotion/player";
import { SpatialPush } from "@/components/ui/spatial-push";

const BusinessShowcase = () => (
  <SpatialPush
    from={
      <div className="w-full h-full bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">For Businesses</h2>
          <p className="text-gray-600 mt-4">Scale your operations with CareTip</p>
        </div>
      </div>
    }
    to={
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">For Staff</h2>
          <p className="text-gray-600 mt-4">Grow your earnings with real-time payouts</p>
        </div>
      </div>
    }
    direction="left"
  />
);

export function BusinessStaffShowcase() {
  return (
    <Player
      component={BusinessShowcase}
      durationInFrames={120}
      fps={30}
      compositionWidth={1280}
      compositionHeight={720}
      style={{ width: '100%', height: 'auto' }}
      autoPlay
      loop
      acknowledgeRemotionLicense
    />
  );
}
```

## ⚙️ Component Props

### AnimatedHeroPlayer Props

```tsx
interface AnimatedHeroProps {
  autoPlay?: boolean;        // Auto-play animation on load (default: true)
  loop?: boolean;            // Loop animation infinitely (default: true)
  controls?: boolean;        // Show playback controls (default: false)
  width?: number;            // Composition width in pixels (default: 1280)
  height?: number;           // Composition height in pixels (default: 720)
  className?: string;        // Additional CSS classes
}
```

### SpatialPush Props

```tsx
interface SpatialPushProps {
  from?: ReactNode;              // Content for first scene (optional)
  to?: ReactNode;                // Content for second scene (optional)
  direction?: "up" | "down" | "left" | "right";  // Animation direction (default: "up")
  transitionStart?: number;      // Frame where transition begins (default: 40% of duration)
  transitionDuration?: number;   // Animation duration in frames (default: 30)
  speed?: number;                // Animation speed multiplier (default: 1)
  className?: string;            // CSS classes
}
```

## 🎨 Customization Tips

### Animation Direction

The animation can push in four directions:
- **"up"** - Content slides in from bottom
- **"down"** - Content slides in from top
- **"left"** - Content slides in from right
- **"right"** - Content slides in from left

### Performance Optimization

1. **Set loop={false}** if animation should play once
2. **Adjust fps** (frames per second) - lower values use less CPU
3. **Use className** to add responsive breakpoints
4. **Lazy-load** using React.lazy() for heavy animations

### Mobile Responsiveness

```tsx
<AnimatedHeroPlayer
  width={window.innerWidth > 768 ? 1280 : 768}
  height={window.innerWidth > 768 ? 720 : 420}
  className="w-full"
/>
```

## 🐛 Troubleshooting

### Player Not Showing

**Problem:** Animation component renders but player is blank

**Solution:** 
1. Check browser console for errors
2. Verify `acknowledgeRemotionLicense` prop is present
3. Ensure Remotion packages are installed: `npm list remotion @remotion/player`

### Performance Issues

**Problem:** Animation is choppy or stuttering

**Solution:**
1. Reduce fps: change from 30 to 24
2. Lower resolution: change width/height
3. Check browser CPU usage (DevTools → Performance)

### Build Errors

**Problem:** "Cannot find module 'remotion'" after installation

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Where to Use

### Recommended Locations:

1. **Landing Page Hero Section**
   - Replace or enhance existing hero with animated transitions
   - Create dynamic product showcase

2. **Onboarding Selection Page**
   - Animate transition between Business/Staff options
   - Show different feature sets for each role

3. **Feature Showcase Sections**
   - Transition between feature demonstrations
   - TipPage animations

4. **Dashboard Transitions**
   - Smooth scene changes between dashboard views
   - Loading state animations

### Not Recommended For:

- High-frequency updates (real-time stats)
- List/table animations (use Framer Motion instead)
- Hover effects on small elements

## 🔄 Next Steps

1. ✅ Install dependencies: `npm install remotion @remotion/player`
2. ✅ Test demo page: `npm run dev` → `/hero-animation-demo`
3. 🎨 Integrate into landing page hero
4. 🎬 Add custom scenes with business content
5. 📱 Test responsiveness on mobile

## 🎓 Resources

- [Remotion Documentation](https://www.remotion.dev)
- [@remotion/player Guide](https://www.remotion.dev/docs/player)
- [Spring Physics Config](https://www.remotion.dev/docs/spring)
- [Interpolation Guide](https://www.remotion.dev/docs/interpolate)

## ✨ Project Status

- ✅ Components created
- ✅ Route added
- ✅ Demo page ready
- ⏳ Waiting for dependency installation
- ⏳ Ready for integration into hero sections

---

**Next Command:** `npm install remotion @remotion/player`

View demo: `http://localhost:5173/hero-animation-demo`
