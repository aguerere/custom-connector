//#r "System.dll"
//#r "System.Data.dll"

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

public struct Name 
{
    public string familyName { get; set; }
    public string givenName  { get; set; }
}

public struct Email 
{
    public string value { get; set; }
    public string type { get; set; }
}

public class Person
{
    public string id                 { get; set; }
    public string userName           { get; set; }
    public string displayName        { get; set; }
    public Name name                 { get; set; }
    public IEnumerable<Email> emails { get; set; }

    public Person(IDataRecord dr) 
    {
        id = dr["Id"].ToString();
        userName = dr["Name"].ToString();
        displayName = dr["DisplayName"].ToString();
        name = new Name { familyName = dr["LastName"].ToString(), givenName = dr["FirstName"].ToString() };
        emails = new Email[] { new Email { value = dr["Email"].ToString() } };
    }
}

class Startup
{

    public async Task<object> Invoke(IDictionary<string, object> usrNameAndPassword)
    {
        var userName = (string)usrNameAndPassword["userName"];
        var password = (string)usrNameAndPassword["password"];

        //you can use the web.config to store the connection string.
        //using (var connection = new SqlConnection(Environment.GetEnvironmentVariable("CONNECTION_STRING")))
        
        using (var connection = new SqlConnection("Server=.\\sqlexpress;Database=wellscordoba;User Id=wellsweb;Password=wellsweb;"))
        {
            using (var command = new SqlCommand(@"SELECT Id, DisplayName, Name, FirstName, LastName, Email, Password 
                                                 FROM Users 
                                                 WHERE name = @name", connection))
            {
                
                await connection.OpenAsync();

                command.Parameters.AddWithValue("@name", userName);

                using (var reader = await command.ExecuteReaderAsync(CommandBehavior.CloseConnection)) {
                    
                    if (!reader.Read())
                    {
                        return null;
                    }

                    //if (!passwordMatch(reader['passwordHash'], password)) return null;
                    
                    return new Person(reader);
                }
            }
        }
    }
}