using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _service;

        public NotificationController(
            NotificationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            int userId = 1;

            var result = await _service
                .GetMyNotifications(userId);

            return Ok(result);
        }

        [HttpPost("read/{id}")]
        public async Task<IActionResult> Read(int id)
        {
            await _service.ReadNotification(id);

            return Ok();
        }
    }
}