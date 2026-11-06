namespace Procurement.Application.Vendoring;

public record VendorContactData(string Name, string? Email, string? Phone, bool IsPrimary);

// Snapshot of everything proposed at registration; the real Vendors/VendorBankAccounts/
// VendorContacts/VendorCategories rows are only created once the Procurement-HOD approves
// (BR-019/020) - until then this JSON on VendorRegistrationRequests.ProposedData is the only
// record of it.
public record VendorRegistrationData(
    string LegalName,
    string Ntn,
    string? Strn,
    List<long> CategoryIds,
    string BankName,
    string AccountTitle,
    string AccountNo,
    List<VendorContactData> Contacts);
