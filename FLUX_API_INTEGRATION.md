# Flux Kontext API Integration

## Changes Made

The project has been updated to use the actual KIE.ai Flux Kontext API instead of incorrectly using Google's Gemini model for Flux generation.

### Key Changes:

1. **Updated `handleFluxGenerate` function** in `index.tsx`:
   - Now makes actual HTTP requests to `https://api.kie.ai/flux-kontext/generate-or-edit-image`
   - Supports both text-to-image and image-to-image workflows
   - Properly handles form data for image uploads
   - Converts returned image URLs to base64 for app consistency

2. **Added KIE API Key support**:
   - Updated `vite.config.ts` to include `KIE_API_KEY` environment variable
   - Added `KIE_API_KEY=PLACEHOLDER_KIE_API_KEY` to `.env.local`
   - Updated README with instructions for both API keys

3. **Enhanced UI**:
   - Added output format selection (JPEG/PNG)
   - Updated description to clarify it uses KIE.ai's API
   - Maintained all existing Flux parameters

### API Parameters Supported:

- `prompt`: Text description for generation/editing
- `model`: flux-kontext-pro or flux-kontext-max
- `aspect_ratio`: 21:9, 16:9, 4:3, 1:1, 3:4, 9:16 (text-to-image only)
- `output_format`: jpeg or png
- `safety_tolerance`: 0-6 for generation, 0-2 for editing
- `enable_translation`: Auto-translate prompts
- `prompt_upsampling`: Enhance prompt quality
- `callback_url`: Optional webhook URL
- `watermark`: Optional watermark text
- `upload_cn`: Upload to China CDN

### Required API Keys:

1. **GEMINI_API_KEY**: For main image editing features (existing)
2. **KIE_API_KEY**: For Flux Kontext generation (new)
   - Get your API key from https://kie.ai
   - Replace `PLACEHOLDER_KIE_API_KEY` in `.env.local`

### Error Handling:

- Validates KIE API key presence
- Provides detailed error messages for API failures
- Handles both JSON and FormData request formats
- Gracefully converts between image formats

The Flux tab now attempts to use the KIE.ai Flux Kontext API with multiple endpoint fallbacks. If KIE.ai is unavailable, it falls back to Gemini with a warning message.

### Correct API Implementation:

The implementation now uses the correct KIE.ai API endpoint as documented:
- **Endpoint**: `https://api.kie.ai/api/v1/flux/kontext/generate`
- **Method**: POST with JSON body
- **Authentication**: Bearer token in Authorization header
- **Response**: Returns a taskId that is polled for completion

### API Workflow:

1. **Submit Task**: Send generation request to `/api/v1/flux/kontext/generate`
2. **Get Task ID**: API returns a taskId for tracking
3. **Poll Status**: Use `GET /api/v1/flux/kontext/record-info?taskId={taskId}` to check completion
4. **Parse Response**: Handle `successFlag` values (0=generating, 1=completed, 2=create failed, 3=generation failed)
5. **Retrieve Image**: Download from `data.response.resultImageUrl` and convert to base64
6. **Fallback**: If KIE.ai fails, automatically falls back to Gemini

### Debugging Features:

- **Console Logging**: Detailed logs for task submission, polling, and responses
- **Correct Endpoint**: Uses proper `/api/v1/flux/kontext/get-image-details` for polling
- **Callback Structure**: Parses response according to KIE.ai callback format
- **Status Code Handling**: Handles 200 (success), 400 (policy violation), 500 (error), 501 (failed)
- **Final Attempt**: Makes one last try to retrieve results before timeout
- **Task ID Display**: Shows task ID for manual checking in KIE.ai dashboard

### Response Structure:

The implementation now correctly handles KIE.ai's record-info response:

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task12345",
    "successFlag": 1,
    "response": {
      "originImageUrl": "https://example.com/original.jpg",
      "resultImageUrl": "https://tempfile.aiquickdraw.com/..."
    },
    "errorCode": null,
    "errorMessage": ""
  }
}
```

**SuccessFlag Values:**
- `0`: Task is generating (continue waiting)
- `1`: Generation completed successfully
- `2`: Create task failed
- `3`: Generation failed

### Parameter Mapping:

The implementation correctly maps UI parameters to API parameters:
- `enableTranslation` (not enable_translation)
- `inputImage` (for image editing, as URL not file upload)
- `aspectRatio` (not aspect_ratio)
- `outputFormat` (not output_format)
- `promptUpsampling` (not prompt_upsampling)
- `safetyTolerance` (not safety_tolerance)
- `callBackUrl` (not callback_url)

# Generate or Edit Image

> Create a new image generation or editing task using the Flux Kontext AI model.

## OpenAPI

````yaml flux-kontext-api/flux-kontext-api.json post /api/v1/flux/kontext/generate
paths:
  path: /api/v1/flux/kontext/generate
  method: post
  servers:
    - url: https://api.kie.ai
      description: API Server
  request:
    security:
      - title: BearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                All APIs require authentication via Bearer Token.


                Get API Key:

                1. Visit [API Key Management Page](https://kie.ai/api-key) to
                get your API Key


                Usage:

                Add to request header:

                Authorization: Bearer YOUR_API_KEY


                Note:

                - Keep your API Key secure and do not share it with others

                - If you suspect your API Key has been compromised, reset it
                immediately in the management page
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              prompt:
                allOf:
                  - type: string
                    description: >-
                      Text prompt describing the desired image or edit. Required
                      for both generation and editing modes.


                      - Should be detailed and specific

                      - For image editing, describe the desired changes

                      - For image generation, describe the complete scene

                      - IMPORTANT: Only English language is supported
                    example: >-
                      A serene mountain landscape at sunset with a lake
                      reflecting the orange sky
              enableTranslation:
                allOf:
                  - type: boolean
                    description: >-
                      Whether to enable automatic translation feature.


                      - Since prompt only supports English, when this parameter
                      is true, the system will automatically translate
                      non-English prompts to English

                      - If your prompt is already in English, you can set this
                      to false

                      - Default value: true
                    example: true
              uploadCn:
                allOf:
                  - type: boolean
                    description: >-
                      (Optional) Specifies the server region for image upload.
                      Set to true to use servers in China, false to use
                      non-China servers. Choose based on your geographical
                      location for optimal upload speeds.
                    example: false
              inputImage:
                allOf:
                  - type: string
                    format: uri
                    description: >-
                      URL of the input image for editing mode. Required when
                      editing an existing image.


                      - Must be a valid image URL

                      - Image must be accessible to the API server
                    example: https://example.com/input-image.jpg
              aspectRatio:
                allOf:
                  - type: string
                    description: >-
                      Output image aspect ratio. You Applicable in both
                      text-to-image generation and image editing modes.


                      For **text-to-image generation** , the output image will
                      follow the specified aspect ratio.


                      For **image editing** , if aspectRatio is provided, the
                      edited image will follow that ratio. If not provided, the
                      image will retain its original aspect ratio.


                      Supported Aspect Ratios:


                      | Ratio | Format Type | Common Use Cases |

                      |-------|-------------|-----------------|

                      | 21:9  | Ultra-wide  | Cinematic displays, panoramic
                      views |

                      | 16:9  | Widescreen  | HD video, desktop wallpapers |

                      | 4:3   | Standard    | Traditional displays,
                      presentations |

                      | 1:1   | Square      | Social media posts, profile
                      pictures |

                      | 3:4   | Portrait    | Magazine layouts, portrait photos
                      |

                      | 9:16  | Mobile Portrait | Smartphone wallpapers, stories
                      |


                      > Note: Default ratio is "16:9" if not specified.
                    enum:
                      - '21:9'
                      - '16:9'
                      - '4:3'
                      - '1:1'
                      - '3:4'
                      - '9:16'
                    default: '16:9'
              outputFormat:
                allOf:
                  - type: string
                    description: Output image format.
                    enum:
                      - jpeg
                      - png
                    default: jpeg
              promptUpsampling:
                allOf:
                  - type: boolean
                    description: |-
                      - If true, performs upsampling on the prompt
                      - May increase processing time
                    default: false
              model:
                allOf:
                  - type: string
                    description: >-
                      Model version to use for generation.


                      Available Options:


                      | Model | Description |

                      |--------------|-------------|

                      | flux-kontext-pro | Standard model with balanced
                      performance |

                      | flux-kontext-max | Enhanced model with advanced
                      capabilities |


                      > Note: Choose flux-kontext-max for more demanding tasks
                      that require higher quality and detail
                    enum:
                      - flux-kontext-pro
                      - flux-kontext-max
                    default: flux-kontext-pro
              callBackUrl:
                allOf:
                  - type: string
                    format: uri
                    description: >-
                      The URL to receive image generation or editing task
                      completion updates. Optional but recommended for
                      production use.


                      - System will POST task status and results to this URL
                      when image generation or editing completes

                      - Callback includes generated image URLs and task
                      information for both text-to-image and image editing
                      operations

                      - Your callback endpoint should accept POST requests with
                      JSON payload containing image results

                      - For detailed callback format and implementation guide,
                      see [Image Generation/Editing
                      Callbacks](./generate-or-edit-image-callbacks)

                      - Alternatively, use the Get Image Details endpoint to
                      poll task status
                    example: https://your-callback-url.com/callback
              safetyTolerance:
                allOf:
                  - type: integer
                    description: >-
                      **For Image Generation Mode:**

                      Moderation level for inputs and outputs. Value ranges from
                      0 (most strict) to 6 (more permissive).


                      **For Image Editing Mode:**

                      Moderation level for inputs and outputs. Value ranges from
                      0 (most strict) to 2 (balanced).


                      Default: 2
                    enum:
                      - 0
                      - 1
                      - 2
                      - 3
                      - 4
                      - 5
                      - 6
                    default: 2
                    example: 2
              watermark:
                allOf:
                  - type: string
                    description: >-
                      Watermark identifier to add to the generated image.


                      - Optional

                      - If provided, a watermark will be added to the output
                      image
                    example: your-watermark-id
            required: true
            requiredProperties:
              - prompt
            example:
              prompt: >-
                A serene mountain landscape at sunset with a lake reflecting the
                orange sky
              enableTranslation: true
              aspectRatio: '16:9'
              outputFormat: jpeg
              promptUpsampling: false
              model: flux-kontext-pro
        examples:
          example:
            value:
              prompt: >-
                A serene mountain landscape at sunset with a lake reflecting the
                orange sky
              enableTranslation: true
              aspectRatio: '16:9'
              outputFormat: jpeg
              promptUpsampling: false
              model: flux-kontext-pro
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              code:
                allOf:
                  - type: integer
                    enum:
                      - 200
                      - 401
                      - 402
                      - 404
                      - 422
                      - 429
                      - 455
                      - 500
                      - 501
                      - 505
                    description: >-
                      Response status code


                      - **200**: Success - Request has been processed
                      successfully

                      - **401**: Unauthorized - Authentication credentials are
                      missing or invalid

                      - **402**: Insufficient Credits - Account does not have
                      enough credits to perform the operation

                      - **404**: Not Found - The requested resource or endpoint
                      does not exist

                      - **422**: Validation Error - The request parameters
                      failed validation checks.The request parameters are
                      incorrect, please check the parameters.

                      - **429**: Rate Limited - Request limit has been exceeded
                      for this resource

                      - **455**: Service Unavailable - System is currently
                      undergoing maintenance

                      - **500**: Server Error - An unexpected error occurred
                      while processing the request

                      Server Error - The security tolerance level is out of
                      range and should be 0-2 or 0-6

                      - **501**: Generation Failed - Image generation task
                      failed

                      - **505**: Feature Disabled - The requested feature is
                      currently disabled
              msg:
                allOf:
                  - type: string
                    description: Error message when code != 200
                    example: success
              data:
                allOf:
                  - type: object
                    properties:
                      taskId:
                        type: string
                        description: >-
                          Task ID, can be used with Get Image Details endpoint
                          to query task status
                        example: task12345
        examples:
          example:
            value:
              code: 200
              msg: success
              data:
                taskId: task12345
        description: Request successful
    '500':
      _mintlify/placeholder:
        schemaArray:
          - type: any
            description: Server Error
        examples: {}
        description: Server Error
  deprecated: false
  type: path
components:
  schemas: {}

````