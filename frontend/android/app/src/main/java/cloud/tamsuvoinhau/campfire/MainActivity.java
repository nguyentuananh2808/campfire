package cloud.tamsuvoinhau.campfire;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeviceUnlockPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
