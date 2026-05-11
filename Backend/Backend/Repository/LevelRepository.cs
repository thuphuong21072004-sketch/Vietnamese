using Backend.Models;

namespace Backend.Repository
{
    public interface LevelRepository
    {
        Task<List<Level>> GetAllLevels(bool? isActive);
        Task<Level> GetLevelById(int id);
        Task AddLevel(Level level);
        Task UpdateLevel(Level level);
        Task DeleteLevels(List<int> ids);
        Task SaveLevel();
        Task<int> GetMaxOrderIndex();
        IQueryable<Level> GetQueryable();
        Task<Level?> GetNextLevel(int levelId);
        Task<Level?> GetByName(string name);

    }
}
