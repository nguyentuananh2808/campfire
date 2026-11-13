package cloud.tamsuvoinhau.campfire;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DeviceUnlock")
public class DeviceUnlockPlugin extends Plugin {
    private boolean receiverRegistered;

    private final BroadcastReceiver unlockReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_USER_PRESENT.equals(intent.getAction())) {
                notifyListeners("deviceUnlocked", new JSObject());
            }
        }
    };

    @Override
    public void load() {
        ContextCompat.registerReceiver(
            getContext(),
            unlockReceiver,
            new IntentFilter(Intent.ACTION_USER_PRESENT),
            ContextCompat.RECEIVER_NOT_EXPORTED
        );
        receiverRegistered = true;
    }

    @Override
    protected void handleOnDestroy() {
        if (receiverRegistered) {
            getContext().unregisterReceiver(unlockReceiver);
            receiverRegistered = false;
        }
        super.handleOnDestroy();
    }
}
