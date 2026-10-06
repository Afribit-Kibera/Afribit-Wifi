# Isolated router fixtures. Dummy MACs, random unknown passwords, no client login.
# Requires an empty deadline lane; keeps the consumed paid-pass evidence intact.
{
    :if ([/system identity get name] != "KM-LAB-001" || [/system routerboard get serial-number] != "HH70A8H82EG") do={ :error "Unexpected fixture router" }
    :if ([/system ntp client get status] != "synchronized") do={ :error "Clock must be synchronized" }
    :if ([:len [/ip hotspot user find where profile="KM-MESH-DEADLINE-5M"]] != 0) do={ :error "Fixtures require an empty deadline lane" }
    :local now ([:tonsec [:timestamp]] / 1000000000)
    :local before [/system scheduler get [find where name="KM-MESH-DEADLINE-TICK"] run-count]
    /ip hotspot user add name=md-fixture-expired password=[:rndstr length=32] server=KM-MESH-001 profile=KM-MESH-DEADLINE-5M mac-address=02:00:00:FE:00:01 limit-uptime=1m comment=("mesh-deadline-v1:" . ($now - 1))
    /ip hotspot user add name=md-fixture-malformed password=[:rndstr length=32] server=KM-MESH-001 profile=KM-MESH-DEADLINE-5M mac-address=02:00:00:FE:00:02 limit-uptime=1m comment="invalid-deadline"
    /ip hotspot user add name=md-fixture-future password=[:rndstr length=32] server=KM-MESH-001 profile=KM-MESH-DEADLINE-5M mac-address=02:00:00:FE:00:03 limit-uptime=1m comment=("mesh-deadline-v1:" . ($now + 6))
    # Let the scheduler act; do not manually run the sweep for this assertion.
    :delay 9s
    :foreach account in={"md-fixture-expired";"md-fixture-malformed";"md-fixture-future"} do={
        :local u [/ip hotspot user find where name=$account]
        :if ([/ip hotspot user get $u disabled] != true || [/ip hotspot user get $u uptime] != 0s) do={ :error "Deadline did not close an unused fixture" }
        :put ($account . ": disabled=true uptime=0s")
    }
    :if ([/system scheduler get [find where name="KM-MESH-DEADLINE-TICK"] run-count] <= $before) do={ :error "Local scheduler did not run" }
    # Execute the installed login hook against the disabled fixture, not a client.
    :local hook [:parse (":local user \"md-fixture-expired\"; " . [/ip hotspot user profile get [find where name="KM-MESH-DEADLINE-5M"] on-login])]
    :local refused false
    :do { $hook } on-error={ :set refused true }
    :if ($refused != true) do={ :error "Expired login hook did not refuse" }
    :put "EXPIRED_LOGIN_HOOK_REFUSED"
    /ip hotspot user add name=md-fixture-boot password=[:rndstr length=32] server=KM-MESH-001 profile=KM-MESH-DEADLINE-5M mac-address=02:00:00:FE:00:04 limit-uptime=1m comment=("mesh-deadline-v1:" . (([:tonsec [:timestamp]] / 1000000000) + 120))
    :local boot [:parse [/system scheduler get [find where name="KM-MESH-DEADLINE-BOOT"] on-event]]
    $boot
    :if ([/ip hotspot user get [find where name="md-fixture-boot"] disabled] != true) do={ :error "Startup body did not close unused allowance" }
    :put "STARTUP_BODY_CLOSED_FUTURE_FIXTURE: no actual reboot performed"
    /ip hotspot user remove [find where name~"^md-fixture-" and profile="KM-MESH-DEADLINE-5M"]
    :put "DEADLINE_FIXTURES_PASSED_AND_REMOVED"
}
