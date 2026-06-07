using System.Net;
using System.Text.Json;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            await HandleException(context, HttpStatusCode.Forbidden, ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            await HandleException(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (ArgumentException ex)
        {
            await HandleException(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await HandleException(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = ex.ToString()
            });
        }
    }

    private static async Task HandleException(HttpContext context, HttpStatusCode status, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)status;

        var result = JsonSerializer.Serialize(new
        {
            success = false,
            message = message
        });

        await context.Response.WriteAsync(result);
    }
}