import { NativeModule, requireNativeModule } from 'expo';

declare class UsageStatsModule extends NativeModule<{}> {}

export default requireNativeModule<UsageStatsModule>('UsageStats');
