using System.Diagnostics;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Profile.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Profile;

public sealed class ProfileService : IProfileService
{
    private readonly AppDbContext _dbContext;

    public ProfileService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task ExecuteAsync(UpdateStudentProfileCommand command)
    {
        var profile = await _dbContext.Accounts.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == command.Id);

        if (profile is null)
        {
            return;
        }

        if (profile.User is not Student)
        {
            throw new ApiException(ProfileErrors.NotLoggedIn);
        }

        var student = (Student)profile.User;

        if (!string.IsNullOrWhiteSpace(command.FullName))
        {
            student.FullName = command.FullName;
        }

        if (!string.IsNullOrWhiteSpace(command.PhoneNumber))
        {
            student.PhoneNumber = command.PhoneNumber;
        }

        if (!string.IsNullOrWhiteSpace(command.ParentPhoneNumber))
        {
            student.PhoneNumber = command.ParentPhoneNumber;
        }

        if (!string.IsNullOrWhiteSpace(command.StudentCode))
        {
            student.PhoneNumber = command.StudentCode;
        }

        if (!string.IsNullOrWhiteSpace(command.ProfilePicture))
        {
            profile.ProfilePicture = command.ProfilePicture;
        }

        if (command.Level.HasValue)
        {
            student.Level = command.Level.Value;
        }

        _dbContext.Update(profile);

        await _dbContext.SaveChangesAsync();

    }

    public async Task<GetProfileResult> QueryAsync(GetProfileQuery query)
    {
        // var profile = await _dbContext.Accounts.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == query.Id);

        var account = await _dbContext.Accounts
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == query.Id) ??
            throw new ApiException(ProfileErrors.NotFound);



        return account.User switch
        {
            Student student => new GetStudentProfileResult
            {
                Id = account.Id,
                Role = account.User.Role,
                Email = account.Email,
                FullName = student.FullName,
                Level = student.Level,
                ParentPhoneNumber = student.ParentPhoneNumber,
                StudentCode = student.StudentCode,
                PhoneNumber = student.PhoneNumber,
                School = student.SchoolName,
                Credits = student.Credit,
                ProfilePicture = account.ProfilePicture
            },
            Assistant assistant => new GetAssistantProfileResult
            {
                Id = account.Id,
                Email = account.Email,
                Role = account.User.Role,
                Permissions = assistant.Permissions.ToList()
            },
            Teacher teacher => new GetTeacherProfileResult
            {
                Id = account.Id,
                Role = account.User.Role,
                Email = account.Email
            },
            _ => throw new UnreachableException()
        };
    }
}
