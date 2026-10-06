import { ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

const withUsageStats: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    const usesPermission = androidManifest.manifest['uses-permission'] || [];
    if (!usesPermission.some(p => p.$['android:name'] === 'android.permission.PACKAGE_USAGE_STATS')) {
      usesPermission.push({
        $: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions'
        } as any
      });
      androidManifest.manifest['uses-permission'] = usesPermission;
    }

    if (!androidManifest.manifest.$['xmlns:tools']) {
      (androidManifest.manifest.$ as any)['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const queries = androidManifest.manifest.queries || [];
    const hasIntent = queries.some((q: any) => 
      q.intent && q.intent.some((i: any) => 
        i.action && i.action.some((a: any) => a.$['android:name'] === 'android.intent.action.MAIN') &&
        i.category && i.category.some((c: any) => c.$['android:name'] === 'android.intent.category.LAUNCHER')
      )
    );

    if (!hasIntent) {
      queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }]
          }
        ]
      });
      androidManifest.manifest.queries = queries;
    }

    return config;
  });
};

export default withUsageStats;
