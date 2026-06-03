---
name: Warm Clinical Premium
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system establishes a high-end health tech aesthetic defined as "Warm Clinical." It balances the sterile precision of medical environments with the approachability of premium consumer wellness. The target audience includes health-conscious professionals and clinical practitioners who demand both efficiency and a sense of calm.

The design style is **Corporate / Modern** with a lean toward **Minimalism**. It prioritizes heavy whitespace, a sophisticated and restrained color palette, and high-quality typography to evoke an emotional response of absolute trust, modern intelligence, and refined care.

## Colors

The palette is anchored by **Deep Slate** (Primary), providing an authoritative and grounded foundation. **Medical Teal** (Secondary) serves as the primary accent, used sparingly for interactive elements and key status indicators to signify health and vitality. 

**Clinical White** (Tertiary) and **Cool Grays** (Neutral) provide the expansive background surfaces and subtle borders required for a clean, breathable interface. This low-vibrancy environment ensures that data and critical health information remain the focal point.

## Typography

The typography utilizes **Be Vietnam Pro** (selected for its geometric similarity to Poppins but with enhanced legibility for clinical data) across all roles. The scale is designed to be highly legible with generous line heights to prevent visual fatigue.

Headlines use semi-bold and bold weights with slight negative letter-spacing to feel tight and professional. Body text is kept at a comfortable 16px default to maintain accessibility. Labels and captions utilize increased letter-spacing and medium-to-bold weights for clear information architecture in dense data views.

## Layout & Spacing

The design system employs a **Fixed Grid** philosophy for desktop (12 columns, 1200px max-width) and a **Fluid Grid** for mobile devices (4 columns). 

A strict 8px spatial rhythm governs all padding and margins. Desktop layouts should prioritize "generous" spacing (`lg` and `xl` units) to maintain the premium feel. Information density is managed through the strategic use of gutters; while cards are separated by 24px, internal card elements should use 16px or 24px padding to ensure content feels contained yet approachable.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and extremely subtle **Ambient Shadows**. Instead of traditional deep shadows, this system uses low-opacity (2-4%) Deep Slate tints for shadows with very large blur radii (20px - 40px) to create a soft, "lifted" effect.

Surfaces should primarily be distinguished by subtle background color shifts (e.g., Clinical White vs. a slightly darker Slate 50). Borders should be thin (1px) and use low-contrast neutrals to define boundaries without adding visual noise.

## Shapes

The shape language is defined by a consistent, modern **16px corner radius** (defined as `rounded-lg`) for all primary containers, cards, and buttons. This significant rounding softens the "clinical" nature of the product, making the high-tech functionality feel more humane and accessible. Smaller elements like tags or input fields should use a 8px radius (`rounded-md`) to maintain a cohesive visual language.

## Components

### Buttons
Primary buttons use the Deep Slate background with white text. Secondary buttons use a subtle Medical Teal outline or text. All buttons must have a height of 48px or 56px to feel substantial and premium, featuring the signature 16px corner radius.

### Cards
Cards are the primary container. They feature a 1px border in a very light neutral and a soft, diffused ambient shadow. Backgrounds are strictly white to maintain a "clean room" aesthetic.

### Input Fields
Fields should be minimalist with a light gray stroke that transitions to Medical Teal on focus. Labels sit outside the field in a bold, smaller font size for clarity.

### Chips & Badges
Used for health status or categories. These use a 50% opacity version of the Medical Teal or other status colors with dark text to ensure they look sophisticated rather than "loud."

### Data Visualization
Charts should utilize the Medical Teal as the primary data line, supported by secondary teals and slates. Avoid high-vibrancy palettes; maintain a monochromatic or analogous flow.