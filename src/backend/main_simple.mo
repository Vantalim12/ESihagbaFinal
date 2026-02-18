// Simple version backup - deployed initially
// This was the working simple version before upgrading to full features

persistent actor {
    public query func healthCheck(): async Bool {
        true
    };

    public query func whoami(): async Text {
        "Blockchain Transaction Tracker"
    };

    public func simpleAdd(a: Nat, b: Nat): async Nat {
        a + b
    };
}
