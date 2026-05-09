{{/*
Expand the name of the chart.
*/}}
{{- define "family-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fully qualified app name.
*/}}
{{- define "family-dashboard.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Chart label (name + version).
*/}}
{{- define "family-dashboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "family-dashboard.labels" -}}
helm.sh/chart: {{ include "family-dashboard.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Selector labels for the API deployment / service.
*/}}
{{- define "family-dashboard.apiSelectorLabels" -}}
app.kubernetes.io/name: {{ include "family-dashboard.name" . }}-api
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels for the web (nginx) deployment / service.
*/}}
{{- define "family-dashboard.webSelectorLabels" -}}
app.kubernetes.io/name: {{ include "family-dashboard.name" . }}-web
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Name of the Secret holding the JWT secret.
Uses existingSecret if provided, otherwise the chart-managed secret.
*/}}
{{- define "family-dashboard.secretName" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- include "family-dashboard.fullname" . }}-secret
{{- end }}
{{- end }}

{{/*
Key within the secret that holds the JWT value.
*/}}
{{- define "family-dashboard.jwtSecretKey" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecretKey }}
{{- else }}
jwt-secret
{{- end }}
{{- end }}

{{/*
Name of the PVC.
Uses existingClaim if provided, otherwise the chart-managed PVC.
*/}}
{{- define "family-dashboard.pvcName" -}}
{{- if .Values.storage.existingClaim }}
{{- .Values.storage.existingClaim }}
{{- else }}
{{- include "family-dashboard.fullname" . }}-data
{{- end }}
{{- end }}
