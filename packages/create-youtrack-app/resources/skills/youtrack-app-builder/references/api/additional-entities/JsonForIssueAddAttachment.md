# JsonForIssueAddAttachment

Type: `object`  

## Contents

### Properties
- `content`
- `name`
- `charset`
- `mimeType`

## Properties

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String` | The content of the file in binary form or as a base64 data URI. Base64 content must use the `data:[MIME type];base64,[content]` syntax. |
| `name` | `String` | The name of the file. |
| `charset` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType` | `String` | The MIME type of the file. |
