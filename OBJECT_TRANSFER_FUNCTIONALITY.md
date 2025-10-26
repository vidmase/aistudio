# Object Transfer Functionality

## Overview

Updated the reference images functionality from "Style Reference" to "Object Transfer" - allowing users to upload reference images and transfer specific objects from those images into their main base image through AI-powered image editing.

## Concept

### Object Transfer vs Style Reference

**Previous (Style Reference):**
- Reference images influenced overall style and mood
- Applied artistic styles, color palettes, and aesthetic qualities
- General style guidance for the entire image

**Current (Object Transfer):**
- Reference images provide objects to be transferred
- Specific objects, elements, or subjects can be extracted
- Targeted insertion of objects into the main image

## How It Works

### User Workflow

1. **Upload Main Image** - The base image to edit
2. **Add Object Reference Images** - Images containing objects to transfer
3. **Describe Transfer in Prompt** - Specify which objects to transfer and where
4. **AI Processing** - Gemini analyzes both images and performs the transfer
5. **Result** - Main image with objects transferred from references

### Example Use Cases

**Adding Objects:**
- "Add the red car from the reference image to the parking lot"
- "Transfer the flowers from the reference to the garden area"
- "Place the cat from the reference image on the sofa"

**Replacing Objects:**
- "Replace the old chair with the modern chair from the reference"
- "Change the lamp to the one shown in the reference image"
- "Swap the painting with the artwork from the reference"

**Combining Elements:**
- "Add the trees from reference 1 and the bench from reference 2"
- "Transfer the person from the reference and place them by the window"
- "Include the decorative elements from the reference images"

## Technical Implementation

### Updated UI Labels

**Before:**
```typescript
<label>Style Reference Images (Optional)</label>
<span>Add Style</span>
<p>Reference images will guide the style and mood of your edits.</p>
```

**After:**
```typescript
<label>Object Reference Images (Optional)</label>
<span>Add Object</span>
<p>Objects from these reference images can be transferred into your main image. Describe what objects you want to add in your prompt.</p>
```

### Enhanced Prompt Guidance

**Updated Placeholder:**
```typescript
placeholder="e.g., Add the red car from the reference image to the street, or Transfer the flowers from the reference to the garden..."
```

**Updated Context:**
```typescript
<p>Describe the changes you want to make to the current image. You can transfer objects from reference images by describing them in your prompt.</p>
```

### Analysis Display Updates

**Reframed Analysis Labels:**
- **Objects:** What objects/subjects are detected
- **Elements:** Key visual elements and components  
- **Context:** Environmental context and setting

## AI Processing

### How Gemini Handles Object Transfer

1. **Image Analysis** - Analyzes both main image and reference images
2. **Object Detection** - Identifies objects in reference images
3. **Context Understanding** - Understands spatial relationships and placement
4. **Seamless Integration** - Transfers objects with proper lighting, shadows, perspective
5. **Natural Blending** - Ensures transferred objects look natural in the scene

### Prompt Engineering

**Effective Prompts for Object Transfer:**
- Be specific about which object: "the red bicycle" not just "bicycle"
- Specify placement: "in the foreground", "next to the tree", "on the table"
- Mention integration: "naturally integrated", "with matching lighting"
- Reference image context: "from the reference image", "from the first reference"

## User Interface

### Object Reference Section

**Visual Elements:**
- Grid layout for multiple reference images
- Thumbnail previews with remove buttons
- Object analysis cards showing detected elements
- "Add Object" upload button
- Clear guidance text

**Analysis Display:**
- **Objects**: Main subjects and items detected
- **Elements**: Visual components and features
- **Context**: Environmental and situational context
- **Color Palette**: Dominant colors for reference

### Prompt Interface

**Enhanced Guidance:**
- Clear instructions about object transfer
- Example prompts showing proper syntax
- Context about using reference images
- Placeholder text with transfer examples

## Best Practices

### For Users

**Effective Object Transfer:**
1. **Clear References** - Use images with clearly visible objects
2. **Specific Prompts** - Be precise about what to transfer and where
3. **Context Matching** - Consider lighting, scale, and perspective
4. **Multiple References** - Use different images for different objects

**Example Workflows:**

**Interior Design:**
```
Main Image: Empty living room
Reference: Image with a beautiful lamp
Prompt: "Add the table lamp from the reference image to the side table, matching the room's lighting"
```

**Landscape Enhancement:**
```
Main Image: Garden scene
Reference: Image with colorful flowers
Prompt: "Transfer the red roses from the reference to the flower bed in the foreground"
```

**Product Placement:**
```
Main Image: Kitchen counter
Reference: Image with coffee machine
Prompt: "Place the coffee machine from the reference on the counter, integrated naturally with the kitchen"
```

### For Optimal Results

**Reference Image Quality:**
- High resolution and clear visibility
- Good lighting and contrast
- Isolated or prominent objects
- Similar perspective to main image

**Prompt Specificity:**
- Name specific objects clearly
- Describe desired placement precisely
- Mention integration requirements
- Reference multiple images if using several

## Technical Considerations

### AI Capabilities

**What Works Well:**
- Clear, well-defined objects
- Similar lighting conditions
- Compatible scales and perspectives
- Common objects and subjects

**Challenging Scenarios:**
- Very complex backgrounds
- Extreme scale differences
- Incompatible lighting conditions
- Abstract or artistic elements

### Processing

**Gemini Integration:**
- Analyzes all reference images simultaneously
- Understands spatial relationships
- Maintains visual consistency
- Handles multiple object transfers

## Future Enhancements

### Potential Improvements

1. **Object Masking** - Automatic object isolation in references
2. **Placement Preview** - Show where objects will be placed
3. **Scale Adjustment** - Automatic size matching
4. **Lighting Correction** - Automatic lighting adaptation
5. **Multiple Transfers** - Batch object transfers

### Advanced Features

1. **Object Library** - Save frequently used objects
2. **Smart Placement** - AI suggests optimal placement
3. **Style Matching** - Adapt object style to main image
4. **Perspective Correction** - Automatic perspective adjustment

## Examples

### Simple Object Transfer
```
Main Image: Empty desk
Reference: Image with laptop
Prompt: "Add the laptop from the reference image to the center of the desk"
```

### Complex Scene Building
```
Main Image: Park scene
Reference 1: Image with bench
Reference 2: Image with fountain
Prompt: "Add the wooden bench from reference 1 near the trees and place the fountain from reference 2 in the center of the scene"
```

### Replacement Transfer
```
Main Image: Living room with old TV
Reference: Image with modern TV
Prompt: "Replace the old television with the modern flat-screen TV from the reference image, maintaining the same position"
```

## Status

✅ **UI labels updated**: Object-focused terminology
✅ **Prompt guidance enhanced**: Clear transfer instructions
✅ **Analysis display updated**: Object-centric information
✅ **Help text revised**: Transfer-specific guidance
✅ **Examples provided**: Clear use case demonstrations

## Summary

The reference images functionality has been reframed from style guidance to object transfer, allowing users to upload reference images and transfer specific objects from those images into their main base image. This provides a powerful tool for image composition, object placement, and scene building through AI-powered image editing.

**Key Features:**
- 🎯 **Object Transfer** - Move specific objects between images
- 🎨 **Smart Integration** - AI handles lighting, shadows, perspective
- 📝 **Clear Guidance** - Specific prompts for better results
- 🔄 **Multiple References** - Use several images for different objects
- ✨ **Natural Blending** - Seamless object integration

**Perfect for users who want to build complex scenes by combining objects from multiple reference images!** 🎉