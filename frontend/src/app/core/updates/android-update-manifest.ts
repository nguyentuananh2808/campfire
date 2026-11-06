export interface AndroidUpdateManifest {
  latestVersionCode: number;
  latestVersionName: string;
  minimumSupportedVersionCode: number;
  downloadUrl: string | null;
  releaseNotes: string[];
}
