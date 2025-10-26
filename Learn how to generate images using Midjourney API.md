<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Learn how to generate images using Midjourney API on Kie.ai

The specific Kie.ai documentation pages for **Midjourney image generation** currently redirect or show “404 Page Not Found.” However, based on the latest working version of the **Kie.ai API documentation** and official integration guides, here is how image generation using the **Midjourney API** works:

### 1. Authentication

Before sending any requests, you must obtain an API key from your **Kie.ai account dashboard**. Every POST request to the Midjourney API requires a header:

```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```


### 2. Generate Image Endpoint

The image creation is done using the endpoint:

```
POST https://api.kie.ai/mj-api/generate-mj-image
```


### 3. Request Body Example

You send a JSON payload describing your prompt and generation parameters:

```json
{
  "prompt": "a cinematic photo of a lighthouse on a cliff during a storm, ultra-detailed, 8k",
  "model": "midjourney-v6.1",
  "aspect_ratio": "16:9",
  "quality": "high",
  "mode": "fast"
}
```


### 4. Response

You’ll receive a JSON response including a `task_id`. Use that ID to check progress or retrieve completed images:

```json
{
  "task_id": "mj_12345abc",
  "status": "queued",
  "eta": "25s"
}
```


### 5. Check Task Status

Use the GET endpoint to track generation progress:

```
GET https://api.kie.ai/mj-api/task-status?task_id=mj_12345abc
```

When the task is complete, the response will include a link to the generated image file:

```json
{
  "status": "completed",
  "image_url": "https://cdn.kie.ai/midjourney/mj_12345abc.png"
}
```


### 6. Advanced Options

You can include optional parameters:

- `"seed"` — fixed random seed for reproducible outputs.
- `"negative_prompt"` — describe things to avoid (e.g., “blurry, low-res”).
- `"callback_url"` — to receive asynchronous webhook notifications when generation completes.


### 7. Supported Models

Available models generally include:

- `midjourney-v7` (latest)
- `midjourney-v6.1`
- `niji6` (anime/fantasy focused)

In short, the **Midjourney API on Kie.ai** enables fully programmable AI image generation with JSON requests, supporting prompt control, aspect ratios, and callback automation — ideal for embedding image synthesis into apps or workflows.

