using System.Globalization;

namespace Procurement.Application.Workflow;

/// <summary>
/// Evaluates the small, fixed vocabulary of WorkflowStages.ConditionExpr strings used by this build
/// (e.g. "Amount&gt;1000000", "OverBudget&gt;OVER_BUDGET_OPD_THRESHOLD", "IsHigherQuote&amp;&amp;Amount&gt;OPD_QUOTE_EXCEPTION_THRESHOLD").
/// This is deliberately not a general expression language: clauses are ANDed ("&amp;&amp;"), each clause is either
/// a bare boolean variable name or "left OP right" with OP in {>=, <=, ==, >, <}. An operand is resolved, in order,
/// from the supplied context, then from policySettings (by key), then parsed as a literal number.
/// </summary>
public class ConditionEvaluator
{
    private readonly IReadOnlyDictionary<string, object> _context;
    private readonly IReadOnlyDictionary<string, string> _policySettings;

    public ConditionEvaluator(IReadOnlyDictionary<string, object> context, IReadOnlyDictionary<string, string> policySettings)
    {
        _context = context;
        _policySettings = policySettings;
    }

    public bool Evaluate(string? conditionExpr)
    {
        if (string.IsNullOrWhiteSpace(conditionExpr)) return true;

        foreach (var clause in conditionExpr.Split("&&", StringSplitOptions.TrimEntries))
        {
            if (!EvaluateClause(clause)) return false;
        }
        return true;
    }

    private bool EvaluateClause(string clause)
    {
        foreach (var op in new[] { ">=", "<=", "==", ">", "<" })
        {
            var idx = clause.IndexOf(op, StringComparison.Ordinal);
            if (idx > 0)
            {
                var left = ResolveDecimal(clause[..idx].Trim());
                var right = ResolveDecimal(clause[(idx + op.Length)..].Trim());
                return op switch
                {
                    ">=" => left >= right,
                    "<=" => left <= right,
                    "==" => left == right,
                    ">" => left > right,
                    "<" => left < right,
                    _ => false,
                };
            }
        }

        // Bare boolean identifier, e.g. "IsHigherQuote"
        if (_context.TryGetValue(clause, out var value) && value is bool b) return b;
        return false;
    }

    private decimal ResolveDecimal(string token)
    {
        if (_context.TryGetValue(token, out var value))
        {
            return value switch
            {
                decimal d => d,
                int i => i,
                long l => l,
                bool b => b ? 1 : 0,
                _ => decimal.Parse(value.ToString()!, CultureInfo.InvariantCulture),
            };
        }

        if (_policySettings.TryGetValue(token, out var settingValue))
        {
            return decimal.Parse(settingValue, CultureInfo.InvariantCulture);
        }

        return decimal.Parse(token, CultureInfo.InvariantCulture);
    }
}
