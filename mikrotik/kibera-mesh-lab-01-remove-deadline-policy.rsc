# Close accounts before removing the deadline guards. Preserve original trial evidence.
{
    :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected router" }
    :foreach u in=[/ip hotspot user find where profile="KM-MESH-DEADLINE-5M"] do={
        :local account [/ip hotspot user get $u name]
        /ip hotspot user set $u disabled=yes
        /ip hotspot active remove [find where user=$account]
    }
    # Retain consumed accounts as tombstones; removing the profile is intentional
    # only after its accounts are exported/reconciled by the operator.
    /system scheduler remove [find where name="KM-MESH-DEADLINE-TICK"]
    /system scheduler remove [find where name="KM-MESH-DEADLINE-BOOT"]
    :put "DEADLINE_POLICY_CLOSED: managed accounts disabled; tombstones retained"
}
