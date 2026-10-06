import { registerWebModule, NativeModule } from 'expo';

class UsageStatsModule extends NativeModule<{}> {}

export default registerWebModule(UsageStatsModule, 'UsageStatsModule');
