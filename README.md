# n8n Community Nodes Documentation

[![Publish to npm](https://github.com/akpenou/custom-n8n/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/akpenou/custom-n8n/actions/workflows/npm-publish.yml) [npm source](https://www.npmjs.com/package/n8n-nodes-betterpeople) 

This document covers three n8n community nodes that integrate with different platforms: Notion, Google Slides, and Midjourney. [n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Table of Contents

- [Installation](#installation)
- [YouTube Transcript Node](#youtube-transcript-node)
- [Notion Node (Notion Markdown)](#notion-node-notion-markdown) <!-- to finish -->
- [Markdown to Google Slides Node](#markdown-to-google-slides-node)
- [Midjourney Node](#midjourney-node) <!-- to finish -->
- [Turndown Node](#turndown-node)
- [OnOff Node](#onoff-node)
- [Resources](#resources)


<!-- to finish -->
<!-- 

to create good docuementation in cursor
add node attributes + readme in context

then use this prompt

```
adapte moi le readme pour mieux correspondre aux tâches pouvant être faites par ce node, je veux rendre mon read me plus digest pour les personnes qui utilise le projet

donne moi uniquement les snippets a copier pour la bonne seection + mets à jour le menu
```

-->

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

---

## YouTube Transcript Node

This node allows you to fetch transcripts from YouTube videos in your n8n workflows. It automatically retrieves the subtitles and provides them in both plain text and SRT format.

### Features

- Extract transcripts from YouTube videos
- Support for video URLs or video IDs
- Output in both plain text and SRT format
- Handles multiple languages (auto-detected from video)

### Input

The node accepts:
- YouTube video URL (e.g., https://www.youtube.com/watch?v=videoId)
- YouTube video ID (e.g., videoId)
- YouTube short URL (e.g., https://youtu.be/videoId)

### Output

For each video, the node returns:
- `videoId`: The ID of the processed video
- `transcript`: Complete transcript as plain text
- `srt`: Transcript in SRT format (with timestamps)

### Example Usage

Perfect for:
- Creating video summaries
- Generating subtitles
- Text analysis of video content
- Content repurposing

---

## Notion Node (Notion Markdown)

This node lets you use Notion's functionalities in your n8n workflows. Notion is an all-in-one workspace where you can write, plan, collaborate and get organized.

### Operations

- Fetch Page: Retrieve a page.
- Append Page: Append a page.

### Credentials

To authenticate with Notion, you'll need an API key. Get your Notion API key by following their official documentation.

---

## Markdown to Google Slides Node

Transform your Markdown content directly into Google Slides presentations with this node. Based on [md2googleslides](https://github.com/googleworkspace/md2googleslides), this node allows you to automate presentation creation from structured content.

### Features

- Convert Markdown to Google Slides format
- Append to existing presentations
- Create new presentations
- Copy from template presentations
- Support for basic Markdown syntax

### Input Parameters

- **Content**: Your Markdown content to convert
- **Options**:
  - **Title**: Custom presentation title
  - **Append To**: ID or URL of an existing presentation to append to
  - **Erase**: Option to clear the target presentation before adding new content
  - **Copy From**: ID or URL of a template presentation to use as base

### Example Usage

Perfect for:
- Automating presentation creation from documentation
- Creating slides from dynamic content
- Maintaining consistent presentation formats
- Batch processing Markdown files into presentations

### Authentication

Requires Google OAuth2 credentials with access to Google Slides API. Configure in n8n's credentials section.



---

## Midjourney Node

This node provides various image-related operations in your n8n workflows. Midjourney is a platform/service that provides image manipulation and analysis.

### Operations

- Custom: Use custom values for call.
- Describe: Describe the image.
- Imagine: Generate a grid with 4 images.
- Upscale: Upscale the selected image.
- Variation: Create a variation grid with 4 images.
- Zoom Out: Zoom out the selected image.

### Credentials

Provide the necessary credentials details. For example, if an API key is required, guide the user on how to obtain it.

---

## Turndown Node

A simple and efficient node to convert HTML content into Markdown format.

### Features
- Converts HTML to clean, readable Markdown
- Supports nested HTML structures
- Configurable output destination
- Maintains document structure and formatting

### Input Parameters
- **HTML**: The HTML content to convert
- **Destination Key**: Where to store the converted Markdown (supports nested paths using dot notation)

### Example Usage

Perfect for:
- Converting HTML newsletters to Markdown
- Cleaning up web content for storage
- Preparing HTML content for Markdown-based systems
- Processing HTML emails into readable text

### Output

Returns the converted Markdown text in the specified destination key of your workflow data.

---

## OnOff Node

This node integrates with the OnOff API to manage calls, contacts, and SMS communications.

### Features

- **Call Management**
  - Fetch call records with filtering options (date range, caller/callee numbers)
  - Download call recordings as MP3

- **Contact Management**
  - Retrieve contact list
  - Create or update contacts with details (name, email, phone)

- **SMS Communication**
  - Send SMS messages to specified phone numbers

### Operations

1. **Fetch Calls**
   - Retrieve call records with optional filters:
     - Date range
     - Caller number
     - Callee number

2. **Download Call Recording**
   - Download specific call recordings as MP3 files
   - Automatically handles binary data conversion

3. **Contact Management**
   - Fetch all contacts
   - Create/Update contacts with:
     - First name
     - Last name
     - Email
     - Phone number

4. **Send SMS**
   - Send text messages to specified phone numbers
   - Requires:
     - Recipient phone number
     - Message content

### Credentials

To use this node, you'll need an OnOff API access token. Configure it in your n8n credentials section.

### Example Usage

Perfect for:
- Call center management
- Customer communication automation
- Contact database maintenance
- SMS marketing campaigns

---

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Notion Official Documentation](https://developers.notion.com/)
- [Google Slides Official Documentation](https://developers.google.com/slides)
- [Midjourney Documentation or Website](#) (Replace with the actual link when available)
