package middleware

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Task submissions may be multipart (a reference image plus form fields). The
// model must still be readable so the plugin protocol binding can be pinned;
// otherwise the request falls through to another plugin that expects JSON.
func TestGetModelFromRequestReadsMultipartForm(t *testing.T) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	require.NoError(t, writer.WriteField("model", "MiniMax-H3 768P"))
	require.NoError(t, writer.WriteField("group", "MiniMax H3标准"))
	require.NoError(t, writer.WriteField("seconds", "5"))
	file, err := writer.CreateFormFile("input_reference", "reference_1.png")
	require.NoError(t, err)
	_, err = file.Write([]byte("image-bytes"))
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/videos", bytes.NewReader(body.Bytes()))
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())

	modelRequest, err := getModelFromRequest(c)
	require.NoError(t, err)
	assert.Equal(t, "MiniMax-H3 768P", modelRequest.Model)
	assert.Equal(t, "MiniMax H3标准", modelRequest.Group)
}
