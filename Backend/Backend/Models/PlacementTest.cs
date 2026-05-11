namespace Backend.Models
{
    public class PlacementTest
    {
        public int PlacementId { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
